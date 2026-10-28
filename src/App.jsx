import React, { useEffect, useState, Component } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import GraphView from './components/GraphView';
import Backlinks from './components/Backlinks';
import CommandPalette from './components/CommandPalette';
import LandingPage from './components/landing/LandingPage';
import AIReviewModal from './components/modals/AIReviewModal';
import NoteSynthesisModal from './components/modals/NoteSynthesisModal';
import AIConfigModal from './components/modals/AIConfigModal';
import { Sparkles, AlertCircle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
          <div className="font-semibold mb-1">Component Rendering Issue</div>
          <p>{this.state.error?.message || 'An unexpected rendering error occurred.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-2 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-white rounded text-[10px]"
          >
            Retry Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    return (hash === '#/landing' || path === '/landing') ? 'landing' : 'app';
  });

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], links: [] });
  const [globalGraphData, setGlobalGraphData] = useState({ nodes: [], edges: [], links: [] });
  const [backlinks, setBacklinks] = useState([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isAIReviewOpen, setIsAIReviewOpen] = useState(false);
  const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
  const [synthesisTargetFile, setSynthesisTargetFile] = useState(null);
  const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);
  const [aiConfig, setAIConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_ai_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      activeProvider: 'groq',
      activeModel: 'openai/gpt-oss-120b',
      keys: {},
      models: {},
      baseUrls: {},
    };
  });
  const [showAILinksOnGraph, setShowAILinksOnGraph] = useState(true);
  const [isFullscreenGraph, setIsFullscreenGraph] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Theme state: defaults to light mode with persistent storage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('nexus_theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  // Responsive sidebar and right inspector panel states
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1200 : false;
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    try {
      localStorage.setItem('nexus_theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      setRoute((hash === '#/landing' || path === '/landing') ? 'landing' : 'app');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLaunchApp = () => {
    window.location.hash = '#/app';
    setRoute('app');
  };

  // Sync AI configuration from backend on mount
  useEffect(() => {
    fetch('/api/ai/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.providers) {
          setAIConfig((prev) => {
            const keys = { ...prev.keys };
            const models = { ...prev.models };
            const baseUrls = { ...prev.baseUrls };
            for (const [pId, pData] of Object.entries(data.providers)) {
              if (!models[pId] && pData.activeModel) models[pId] = pData.activeModel;
              if (!baseUrls[pId] && pData.baseUrl) baseUrls[pId] = pData.baseUrl;
            }
            return {
              activeProvider: prev.activeProvider || data.activeProvider || 'groq',
              activeModel: prev.activeModel || data.activeModel || 'openai/gpt-oss-120b',
              keys,
              models,
              baseUrls,
            };
          });
        }
      })
      .catch((err) => console.warn('Could not sync AI config from backend:', err));
  }, []);

  const getAIHeaders = () => {
    const p = aiConfig?.activeProvider || 'groq';
    return {
      'Content-Type': 'application/json',
      'x-ai-provider': p,
      'x-ai-key': aiConfig?.keys?.[p] || '',
      'x-ai-model': aiConfig?.models?.[p] || '',
      'x-ai-base-url': aiConfig?.baseUrls?.[p] || '',
    };
  };

  const handleSaveAIConfig = (newConfig) => {
    setAIConfig(newConfig);
    try {
      localStorage.setItem('nexus_ai_config', JSON.stringify(newConfig));
    } catch (e) {}
    showToast(`Active AI Model: ${newConfig.activeProvider?.toUpperCase()} (${newConfig.activeModel || 'default'})`, 'success');
  };

  const handleReturnToLanding = () => {
    window.location.hash = '#/landing';
    setRoute('landing');
  };

  // Fetch file tree list
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      const fileList = Array.isArray(data) ? data : [];
      setFiles(fileList);
      if (fileList.length > 0 && !activeFileId) {
        setActiveFileId(fileList[0].id);
      }
    } catch (err) {
      setFiles([]);
      showToast('Error loading vault files', 'error');
    }
  };

  // Fetch full global graph
  const fetchGlobalGraph = async () => {
    try {
      const res = await fetch('/api/graph');
      if (res.ok) {
        const data = await res.json();
        setGlobalGraphData(data);
      }
    } catch (err) {
      console.error('Error fetching global graph:', err);
    }
  };

  // Fetch active file data, local graph, and backlinks
  const fetchActiveFileData = async (id) => {
    if (!id) return;
    try {
      const [fileRes, graphRes, backlinksRes] = await Promise.all([
        fetch(`/api/files/${id}`),
        fetch(`/api/files/${id}/graph`),
        fetch(`/api/files/${id}/backlinks`),
      ]);

      if (fileRes.ok) {
        const fileData = await fileRes.json();
        setActiveFile(fileData);
      }
      if (graphRes.ok) {
        const gData = await graphRes.json();
        setGraphData(gData);
      }
      if (backlinksRes.ok) {
        const bData = await backlinksRes.json();
        setBacklinks(Array.isArray(bData) ? bData : []);
      } else {
        setBacklinks([]);
      }
    } catch (err) {
      console.error('Error fetching file details:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchGlobalGraph();
  }, []);

  useEffect(() => {
    if (activeFileId) {
      fetchActiveFileData(activeFileId);
    }
  }, [activeFileId]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectFile = (id) => {
    setActiveFileId(id);
  };

  const handleCreateFile = async (title, folder = 'raw') => {
    try {
      const note_type = folder === 'formal' || folder === 'process' ? 'formal' : 'raw';
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, note_type }),
      });
      if (res.ok) {
        const newFile = await res.json();
        await fetchFiles();
        await fetchGlobalGraph();
        setActiveFileId(newFile.id);
        showToast(`Created note "${title}" in ${note_type === 'formal' ? 'process/' : 'raw/'}`, 'success');
      }
    } catch (err) {
      showToast('Failed to create note', 'error');
    }
  };

  const handleRenameFile = async (id, newTitle) => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        await fetchFiles();
        await fetchGlobalGraph();
        if (activeFileId === id) {
          await fetchActiveFileData(id);
        }
        showToast(`Renamed to "${newTitle}"`, 'success');
      } else {
        showToast('Failed to rename note', 'error');
      }
    } catch (err) {
      showToast('Error renaming note', 'error');
    }
  };

  const handleSaveFile = async (id, payload) => {
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchFiles();
        await fetchActiveFileData(id);
        await fetchGlobalGraph();
      }
    } catch (err) {
      showToast('Error saving note', 'error');
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Note deleted', 'info');
        // Refresh vault files to instantly update relations & clear golden dots
        await fetchFiles();
        await fetchGlobalGraph();
        if (activeFileId === id) {
          const safeFilesList = Array.isArray(files) ? files : [];
          const remaining = safeFilesList.filter((f) => f.id !== id);
          setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
        } else if (activeFileId) {
          // Re-fetch active note so companionNote state is cleared
          await fetchActiveFileData(activeFileId);
        }
      }
    } catch (err) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleProcessAI = async (id) => {
    setIsAIProcessing(true);
    showToast('AI analyzing note connections...', 'info');

    try {
      const res = await fetch(`/api/files/${id}/process`, {
        method: 'POST',
        headers: getAIHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await fetchActiveFileData(id);
        await fetchGlobalGraph();
        if (data.suggestions && data.suggestions.length > 0) {
          setIsAIReviewOpen(true);
          showToast(
            `AI proposed ${data.suggestions.length} candidate(s). Review in inspector to confirm or discard.`,
            'info'
          );
        } else {
          showToast('No new connections discovered for this note.', 'info');
        }
      } else {
        showToast('AI analysis complete', 'info');
      }
    } catch (err) {
      showToast('AI processing error', 'error');
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAcceptLink = async (linkId) => {
    try {
      const res = await fetch(`/api/links/${linkId}/accept`, { method: 'POST' });
      if (res.ok) {
        showToast('Accepted AI link & appended to note!', 'success');
        if (activeFileId) {
          await fetchActiveFileData(activeFileId);
        }
        await fetchGlobalGraph();
      }
    } catch (err) {
      showToast('Failed to accept link', 'error');
    }
  };

  const handleRejectLink = async (linkId) => {
    try {
      const res = await fetch(`/api/links/${linkId}/reject`, { method: 'POST' });
      if (res.ok) {
        showToast('Discarded proposal', 'info');
        if (activeFileId) {
          await fetchActiveFileData(activeFileId);
        }
        await fetchGlobalGraph();
      }
    } catch (err) {
      showToast('Failed to discard link', 'error');
    }
  };

  const handleAcceptAllLinks = async () => {
    const pending = (backlinks || []).filter((b) => b.status === 'pending' || b.is_ai_suggested === 1);
    for (const p of pending) {
      await fetch(`/api/links/${p.id}/accept`, { method: 'POST' });
    }
    showToast(`Confirmed all ${pending.length} AI links!`, 'success');
    if (activeFileId) {
      await fetchActiveFileData(activeFileId);
    }
    await fetchGlobalGraph();
    setIsAIReviewOpen(false);
  };

  const handleRejectAllLinks = async (fileId = activeFileId) => {
    if (!fileId) return;
    try {
      const res = await fetch(`/api/files/${fileId}/suggestions/reject-all`, { method: 'POST' });
      if (res.ok) {
        showToast('Discarded all pending AI link proposals', 'info');
      } else {
        // Fallback: reject individually
        const pending = (backlinks || []).filter((b) => b.status === 'pending' || b.is_ai_suggested === 1);
        for (const p of pending) {
          await fetch(`/api/links/${p.id}/reject`, { method: 'POST' });
        }
        showToast('Discarded all pending AI proposals', 'info');
      }
      await fetchActiveFileData(fileId);
      await fetchGlobalGraph();
      setIsAIReviewOpen(false);
    } catch (err) {
      showToast('Failed to discard proposals', 'error');
    }
  };

  const handleOpenSynthesis = (targetFile = activeFile) => {
    if (!targetFile) return;
    setSynthesisTargetFile(targetFile);
    setIsSynthesisModalOpen(true);
  };

  const handleSynthesisSuccess = async (formalFile, isUpdate) => {
    await fetchFiles();
    await fetchGlobalGraph();
    if (formalFile?.id) {
      setActiveFileId(formalFile.id);
      await fetchActiveFileData(formalFile.id);
    }
    showToast(
      isUpdate
        ? `Updated companion note "${formalFile?.title}"`
        : `Created formal companion note "${formalFile?.title}"!`,
      'success'
    );
  };

  if (route === 'landing') {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7F4] dark:bg-[#111113] text-[#242824] dark:text-[#F4F4F5] relative">
      {/* Toast Notification Banner (Restrained, accessible contrast) */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-3.5 py-2 rounded-lg shadow-lg text-xs font-medium border flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-[#EBF5F0] dark:bg-emerald-950/90 text-[#1F6342] dark:text-emerald-200 border-[#287D54]/30 dark:border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-[#FDF2F2] dark:bg-rose-950/90 text-[#991B1B] dark:text-rose-200 border-[#D32F2F]/30 dark:border-rose-500/40'
              : 'bg-[#FEF7EC] dark:bg-amber-950/90 text-[#9A6214] dark:text-amber-200 border-[#E7A23B]/30 dark:border-amber-500/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#D32F2F] dark:text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#287D54] dark:text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Backdrop for Sidebar Drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Left Pane: Vault Explorer (In-flow on desktop, slide drawer on mobile) */}
      <div
        className={`${
          isSidebarOpen
            ? 'fixed inset-y-0 left-0 z-40 w-72 md:relative md:w-64 md:z-auto md:flex shrink-0 h-full shadow-xl md:shadow-none'
            : 'hidden'
        }`}
      >
        <ErrorBoundary>
          <FileTree
            files={files}
            activeFileId={activeFileId}
            onSelectFile={(id) => {
              handleSelectFile(id);
              if (window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            onReturnToLanding={handleReturnToLanding}
          />
        </ErrorBoundary>
      </div>

      {/* Center Pane: Markdown Editor (Flex-1 on all screen sizes) */}
      <ErrorBoundary>
        <Editor
          file={activeFile}
          onSave={handleSaveFile}
          onProcessAI={handleProcessAI}
          isAIProcessing={isAIProcessing}
          onOpenFullGraph={() => setIsFullscreenGraph(true)}
          onOpenSynthesis={handleOpenSynthesis}
          onOpenAIConfig={() => setIsAIConfigOpen(true)}
          aiConfig={aiConfig}
          onNavigateToFile={handleSelectFile}
          theme={theme}
          onToggleTheme={toggleTheme}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
          onReturnToLanding={handleReturnToLanding}
        />
      </ErrorBoundary>

      {/* Mobile Backdrop for Right Inspector Drawer */}
      {isRightPanelOpen && (
        <div
          onClick={() => setIsRightPanelOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Right Pane: Graph View + Backlinks (In-flow on large screens, slide drawer on tablet/mobile) */}
      <div
        className={`${
          isRightPanelOpen
            ? 'fixed inset-y-0 right-0 z-40 w-80 lg:relative lg:z-auto lg:flex flex-col h-full bg-[#F0F1ED] dark:bg-[#151518] border-l border-[#E3E5DF] dark:border-[#26262c] overflow-hidden shrink-0 shadow-xl lg:shadow-none'
            : 'hidden'
        }`}
      >
        <ErrorBoundary>
          <GraphView
            graphData={graphData}
            globalGraphData={globalGraphData}
            activeFileId={activeFileId}
            onSelectFile={(id) => {
              handleSelectFile(id);
              if (window.innerWidth < 1024) setIsRightPanelOpen(false);
            }}
            showAILinks={showAILinksOnGraph}
            onToggleShowAILinks={setShowAILinksOnGraph}
            isFullscreen={isFullscreenGraph}
            onToggleFullscreen={setIsFullscreenGraph}
            theme={theme}
            onCloseRightPanel={() => setIsRightPanelOpen(false)}
          />
        </ErrorBoundary>
        <div className="flex-1 overflow-hidden min-h-0">
          <ErrorBoundary>
            <Backlinks
              file={activeFile}
              backlinks={backlinks}
              onAcceptLink={handleAcceptLink}
              onRejectLink={handleRejectLink}
              onSelectFile={(id) => {
                handleSelectFile(id);
                if (window.innerWidth < 1024) setIsRightPanelOpen(false);
              }}
              onProcessAI={handleProcessAI}
              isAIProcessing={isAIProcessing}
              showAILinks={showAILinksOnGraph}
              onToggleShowAILinks={setShowAILinksOnGraph}
              onOpenAIReview={() => setIsAIReviewOpen(true)}
              onRejectAllLinks={handleRejectAllLinks}
              onAcceptAllLinks={handleAcceptAllLinks}
              theme={theme}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Cmd+K Quick Switcher Overlay */}
      <ErrorBoundary>
        <CommandPalette
          isOpen={isCmdPaletteOpen}
          onClose={() => setIsCmdPaletteOpen(false)}
          files={files}
          onSelectFile={handleSelectFile}
          theme={theme}
        />
      </ErrorBoundary>

      {/* AI Link Discovery Review Modal */}
      <AIReviewModal
        isOpen={isAIReviewOpen}
        onClose={() => setIsAIReviewOpen(false)}
        file={activeFile}
        proposals={backlinks}
        onAcceptLink={handleAcceptLink}
        onRejectLink={handleRejectLink}
        onAcceptAll={handleAcceptAllLinks}
        onRejectAll={handleRejectAllLinks}
        theme={theme}
      />

      {/* Academic Note Synthesis Modal */}
      <NoteSynthesisModal
        isOpen={isSynthesisModalOpen}
        onClose={() => setIsSynthesisModalOpen(false)}
        file={synthesisTargetFile || activeFile}
        onSynthesisSuccess={handleSynthesisSuccess}
        onNavigateToFile={handleSelectFile}
        theme={theme}
        aiConfig={aiConfig}
      />

      {/* Universal AI Provider & API Key Modal */}
      <AIConfigModal
        isOpen={isAIConfigOpen}
        onClose={() => setIsAIConfigOpen(false)}
        aiConfig={aiConfig}
        onSaveConfig={handleSaveAIConfig}
        theme={theme}
      />
    </div>
  );
}

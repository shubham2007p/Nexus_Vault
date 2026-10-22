import React, { useEffect, useState, Component } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import GraphView from './components/GraphView';
import Backlinks from './components/Backlinks';
import CommandPalette from './components/CommandPalette';
import LandingPage from './components/landing/LandingPage';
import AIReviewModal from './components/modals/AIReviewModal';
import { Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';

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
  const [showAILinksOnGraph, setShowAILinksOnGraph] = useState(true);
  const [isFullscreenGraph, setIsFullscreenGraph] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);

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

  const handleCreateFile = async (title) => {
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const newFile = await res.json();
        await fetchFiles();
        await fetchGlobalGraph();
        setActiveFileId(newFile.id);
        showToast(`Created note "${title}"`, 'success');
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
        const safeFilesList = Array.isArray(files) ? files : [];
        const remaining = safeFilesList.filter((f) => f.id !== id);
        setFiles(remaining);
        await fetchGlobalGraph();
        if (activeFileId === id) {
          setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
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
      const res = await fetch(`/api/files/${id}/process`, { method: 'POST' });
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

  if (route === 'landing') {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111113] text-[#f4f4f5] relative">
      {/* Return to Product Overview floating pill */}
      <button
        onClick={handleReturnToLanding}
        className="fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-full bg-[#1c1c20]/95 hover:bg-[#27272e] border border-[#3b3b45] text-xs font-medium text-stone-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer group"
        title="Return to Nexusvault Website"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
        <span>Website Overview</span>
      </button>

      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold border flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : 'bg-violet-950/90 text-violet-200 border-violet-500/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-violet-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Pane: Vault Explorer */}
      <ErrorBoundary>
        <FileTree
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
        />
      </ErrorBoundary>

      {/* Center Pane: CodeMirror Markdown Editor */}
      <ErrorBoundary>
        <Editor
          file={activeFile}
          onSave={handleSaveFile}
          onProcessAI={handleProcessAI}
          isAIProcessing={isAIProcessing}
          onOpenFullGraph={() => setIsFullscreenGraph(true)}
        />
      </ErrorBoundary>

      {/* Right Pane: Graph View + Backlinks Inspector */}
      <div className="w-80 flex flex-col h-full bg-[#151518] border-l border-[#26262c] overflow-hidden shrink-0">
        <ErrorBoundary>
          <GraphView
            graphData={graphData}
            globalGraphData={globalGraphData}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            showAILinks={showAILinksOnGraph}
            onToggleShowAILinks={setShowAILinksOnGraph}
            isFullscreen={isFullscreenGraph}
            onToggleFullscreen={setIsFullscreenGraph}
          />
        </ErrorBoundary>
        <div className="flex-1 overflow-hidden min-h-0">
          <ErrorBoundary>
            <Backlinks
              file={activeFile}
              backlinks={backlinks}
              onAcceptLink={handleAcceptLink}
              onRejectLink={handleRejectLink}
              onSelectFile={handleSelectFile}
              onProcessAI={handleProcessAI}
              isAIProcessing={isAIProcessing}
              showAILinks={showAILinksOnGraph}
              onToggleShowAILinks={setShowAILinksOnGraph}
              onOpenAIReview={() => setIsAIReviewOpen(true)}
              onRejectAllLinks={handleRejectAllLinks}
              onAcceptAllLinks={handleAcceptAllLinks}
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
      />
    </div>
  );
}

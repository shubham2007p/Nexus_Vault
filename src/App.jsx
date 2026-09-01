import React, { useEffect, useState, Component } from 'react';
import FileTree from './components/FileTree';
import Editor from './components/Editor';
import GraphView from './components/GraphView';
import Backlinks from './components/Backlinks';
import CommandPalette from './components/CommandPalette';
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
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [backlinks, setBacklinks] = useState([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [toast, setToast] = useState(null);

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

  // Fetch active file data, graph, and backlinks
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
        setActiveFileId(newFile.id);
        showToast(`Created note "${title}"`, 'success');
      }
    } catch (err) {
      showToast('Failed to create note', 'error');
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
    showToast('AI Link Agent analyzing vault connections...', 'info');

    try {
      const res = await fetch(`/api/files/${id}/process`, { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        await fetchActiveFileData(id);
        showToast(
          `AI proposed ${data.suggestions.length} new contextual link(s)!`,
          'success'
        );
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
      }
    } catch (err) {
      showToast('Failed to accept link', 'error');
    }
  };

  const handleRejectLink = async (linkId) => {
    try {
      const res = await fetch(`/api/links/${linkId}/reject`, { method: 'POST' });
      if (res.ok) {
        showToast('Rejected AI proposal', 'info');
        if (activeFileId) {
          await fetchActiveFileData(activeFileId);
        }
      }
    } catch (err) {
      showToast('Failed to reject link', 'error');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#16161a]">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold border flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-500/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300" />
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
        />
      </ErrorBoundary>

      {/* Right Pane: Graph View + Backlinks Inspector */}
      <div className="w-80 flex flex-col h-full bg-[#1a1b26] border-l border-[#24283b] overflow-hidden shrink-0">
        <ErrorBoundary>
          <GraphView
            graphData={graphData}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
          />
        </ErrorBoundary>
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            <Backlinks
              file={activeFile}
              backlinks={backlinks}
              onAcceptLink={handleAcceptLink}
              onRejectLink={handleRejectLink}
              onSelectFile={handleSelectFile}
              onProcessAI={handleProcessAI}
              isAIProcessing={isAIProcessing}
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
    </div>
  );
}

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
import AuthModal from './components/modals/AuthModal';
import ConversationSidebar from './components/chattyfi/ConversationSidebar';
import ChattyFiView, { buildStage3StructuredReply } from './components/chattyfi/ChattyFiView';
import { Sparkles, AlertCircle, Compass, Check } from 'lucide-react';

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

  // Workspace mode: 'chattyfi' | 'notes'
  const [workspaceMode, setWorkspaceMode] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#/notes') return 'notes';
    if (hash === '#/chattyfi') return 'chattyfi';
    try {
      return localStorage.getItem('nexus_workspace_mode') || 'chattyfi';
    } catch (e) {
      return 'chattyfi';
    }
  });

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  // ChattyFi Conversation State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationSearchQuery, setConversationSearchQuery] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const replyAbortRef = React.useRef({ aborted: false, pendingPrompt: null });
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
    } catch (e) { }
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
  const [capturingMessageId, setCapturingMessageId] = useState(null);
  const [ambiguousMatchData, setAmbiguousMatchData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
    } catch (e) { }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      const path = window.location.pathname || '';
      if (hash === '#/landing' || path === '/landing') {
        setRoute('landing');
        return;
      }

      setRoute('app');
      if (hash.startsWith('#/notes')) {
        setWorkspaceMode('notes');
        const match = hash.match(/^#\/notes\/(\d+)/);
        if (match && match[1]) {
          const noteId = Number(match[1]);
          if (noteId && noteId !== activeFileId) {
            setActiveFileId(noteId);
          }
        }
      } else if (hash.startsWith('#/chattyfi')) {
        setWorkspaceMode('chattyfi');
        const match = hash.match(/^#\/chattyfi\/([^/?]+)/);
        if (match && match[1]) {
          const convId = match[1];
          if (convId && convId !== activeConversationId) {
            setActiveConversationId(convId);
          }
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchWorkspaceMode = (nextMode) => {
    const resolved = nextMode === 'notes' ? 'notes' : 'chattyfi';
    setWorkspaceMode(resolved);
    try {
      localStorage.setItem('nexus_workspace_mode', resolved);
    } catch (e) { }
    if (resolved === 'notes') {
      window.location.hash = activeFileId ? `#/notes/${activeFileId}` : '#/notes';
    } else {
      window.location.hash = activeConversationId ? `#/chattyfi/${activeConversationId}` : '#/chattyfi';
    }
  };

  const handleLaunchApp = () => {
    const targetMode = workspaceMode || 'chattyfi';
    window.location.hash = targetMode === 'notes' ? '#/notes' : '#/chattyfi';
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
    } catch (e) { }
    showToast(`Active AI Model: ${newConfig.activeProvider?.toUpperCase()} (${newConfig.activeModel || 'default'})`, 'success');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('nexus_session_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem('nexus_session_token');
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('nexus_session_token');
          }
        }
      } catch (err) {
        console.warn('Failed to verify session token:', err);
      }
    };
    checkAuthSession();
  }, []);

  const handleAuthSuccess = async (user, token) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.name || user.email}`, 'success');
    await fetchFiles();
    await fetchGlobalGraph();
    await fetchConversations();
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('nexus_session_token');
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) { }
    localStorage.removeItem('nexus_session_token');
    setCurrentUser(null);
    showToast('Signed out. Switched to Guest Vault.', 'info');
    await fetchFiles();
    await fetchGlobalGraph();
    await fetchConversations();
  };

  const handleReturnToLanding = () => {
    window.location.hash = '#/landing';
    setRoute('landing');
  };

  // Fetch file tree list
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files', {
        headers: getAuthHeaders(),
      });
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
      const res = await fetch('/api/graph', {
        headers: getAuthHeaders(),
      });
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
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
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

  // Fetch ChattyFi conversations list
  const fetchConversations = async (query = conversationSearchQuery) => {
    try {
      setIsLoadingConversations(true);
      const qParam = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await fetch(`/api/chattyfi/conversations${qParam}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
        return list;
      }
      return [];
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch single conversation with full messages and attachments
  const fetchConversationDetail = async (id) => {
    if (!id) {
      setActiveConversation(null);
      setConversationMessages([]);
      return;
    }
    try {
      const res = await fetch(`/api/chattyfi/conversations/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data);
        setConversationMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (err) {
      console.error('Error fetching conversation detail:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchGlobalGraph();
    fetchConversations('').then((list) => {
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    });
  }, []);

  useEffect(() => {
    fetchConversations(conversationSearchQuery);
  }, [conversationSearchQuery]);

  useEffect(() => {
    if (activeConversationId) {
      fetchConversationDetail(activeConversationId);
    } else {
      setActiveConversation(null);
      setConversationMessages([]);
    }
  }, [activeConversationId]);

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
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return;
    setActiveFileId(numericId);
    if (workspaceMode === 'notes') {
      window.location.hash = `#/notes/${numericId}`;
    }
  };

  const handleOpenNoteById = (id) => {
    if (!id) return;
    const numericId = typeof id === 'number' ? id : Number(id);
    setActiveFileId(numericId);
    setWorkspaceMode('notes');
    try {
      localStorage.setItem('nexus_workspace_mode', 'notes');
    } catch (e) { }
    window.location.hash = `#/notes/${numericId}`;
  };

  const handleOpenNoteByTitle = (title) => {
    if (!title) return;
    const normalized = title.trim().toLowerCase();
    const safeList = Array.isArray(files) ? files : [];
    const match = safeList.find((f) => (f.title || '').trim().toLowerCase() === normalized);
    if (match) {
      setActiveFileId(match.id);
      setWorkspaceMode('notes');
      try {
        localStorage.setItem('nexus_workspace_mode', 'notes');
      } catch (e) { }
      window.location.hash = `#/notes/${match.id}`;
      showToast(`Opened note "${match.title}"`, 'info');
    } else {
      showToast(`Note "${title}" not yet created in vault`, 'info');
    }
  };

  // ChattyFi Conversation CRUD Handlers
  const handleCreateConversation = async (initialTitle = 'Untitled Conversation') => {
    try {
      const res = await fetch('/api/chattyfi/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: initialTitle }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetchConversations(conversationSearchQuery);
        setActiveConversationId(created.id);
        setActiveConversation(created);
        setConversationMessages([]);
        handleSwitchWorkspaceMode('chattyfi');
        return created;
      }
    } catch (err) {
      showToast('Failed to create conversation', 'error');
    }
    return null;
  };

  const handleRenameConversation = async (id, newTitle) => {
    try {
      const res = await fetch(`/api/chattyfi/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        const updated = await res.json();
        await fetchConversations(conversationSearchQuery);
        if (String(activeConversationId) === String(id)) {
          setActiveConversation((prev) => (prev ? { ...prev, title: updated.title } : updated));
        }
        showToast(`Renamed conversation to "${newTitle}"`, 'success');
      }
    } catch (err) {
      showToast('Failed to rename conversation', 'error');
    }
  };

  const handleTogglePinConversation = async (id, pinned) => {
    try {
      const res = await fetch(`/api/chattyfi/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      });
      if (res.ok) {
        await fetchConversations(conversationSearchQuery);
      }
    } catch (err) {
      showToast('Failed to update conversation pin', 'error');
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      const res = await fetch(`/api/chattyfi/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Conversation deleted', 'info');
        const updatedList = await fetchConversations(conversationSearchQuery);
        if (String(activeConversationId) === String(id)) {
          setActiveConversationId(updatedList.length > 0 ? updatedList[0].id : null);
        }
      }
    } catch (err) {
      showToast('Failed to delete conversation', 'error');
    }
  };

  const handleSendChatMessage = async (content, stagedAttachments = []) => {
    let targetConvId = activeConversationId;
    let isBrandNew = false;

    if (!targetConvId) {
      const autoTitle = content.slice(0, 56).replace(/\n+/g, ' ').trim() || 'New Study Session';
      const created = await handleCreateConversation(autoTitle);
      if (!created) return;
      targetConvId = created.id;
      isBrandNew = true;
    }

    try {
      // 1. Persist immutable raw user message & staged attachments
      const userRes = await fetch(`/api/chattyfi/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content,
          generationStatus: 'completed',
          processingStatus: 'pending',
          processingMetadata: {
            attachments: stagedAttachments.map((att) => ({
              file_name: att.file_name,
              file_type: att.file_type,
              mime_type: att.mime_type,
              file_size: att.file_size,
              storage_path: att.storage_path,
              preview_url: att.preview_url || '',
              extracted_text: att.extracted_text || null,
            })),
          },
        }),
      });

      if (!userRes.ok) {
        showToast('Failed to save message', 'error');
        return;
      }

      // Auto-title conversation if it was still 'Untitled Conversation'
      if (
        !isBrandNew &&
        activeConversation &&
        (activeConversation.title === 'Untitled Conversation' ||
          activeConversation.title === 'New Conversation')
      ) {
        const derivedTitle = content.slice(0, 56).replace(/\n+/g, ' ').trim();
        if (derivedTitle) {
          await fetch(`/api/chattyfi/conversations/${targetConvId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: derivedTitle }),
          });
        }
      }

      await fetchConversationDetail(targetConvId);
      await fetchConversations(conversationSearchQuery);

      // 2. Unified AI reply generation via backend pipeline
      setIsGeneratingReply(true);
      const abortCtrl = new AbortController();
      replyAbortRef.current = { aborted: false, pendingPrompt: content, convId: targetConvId, controller: abortCtrl };

      const activeProvider = aiConfig?.activeProvider || 'groq';
      const activeModel =
        aiConfig?.models?.[activeProvider] || aiConfig?.activeModel || 'openai/gpt-oss-120b';

      try {
        const replyRes = await fetch(`/api/chattyfi/conversations/${targetConvId}/reply`, {
          method: 'POST',
          signal: abortCtrl.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-ai-provider': activeProvider,
            'x-ai-key': aiConfig?.keys?.[activeProvider] || '',
            'x-ai-model': activeModel,
            'x-ai-base-url': aiConfig?.baseUrls?.[activeProvider] || '',
          },
          body: JSON.stringify({ prompt: content }),
        });

        if (replyAbortRef.current.aborted) {
          return;
        }

        if (replyRes.ok) {
          await fetchConversationDetail(targetConvId);
          await fetchConversations(conversationSearchQuery);
          return;
        }
      } catch (backendReplyErr) {
        if (backendReplyErr.name === 'AbortError' || replyAbortRef.current.aborted) {
          return;
        }
        console.warn('Backend unified reply failed, using contract fallback:', backendReplyErr);
      }

      if (replyAbortRef.current.aborted) {
        return;
      }

      const assistantMarkdown = buildStage3StructuredReply(content, files);

      await fetch(`/api/chattyfi/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: assistantMarkdown,
          generationStatus: 'completed',
          processingStatus: 'pending',
          processingMetadata: {
            provider: activeProvider,
            model: activeModel,
          },
        }),
      });

      await fetchConversationDetail(targetConvId);
      await fetchConversations(conversationSearchQuery);
    } catch (err) {
      console.error('Error in chat turn:', err);
      showToast('Failed to process message', 'error');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleStopChatGeneration = async () => {
    replyAbortRef.current.aborted = true;
    if (replyAbortRef.current.controller) {
      replyAbortRef.current.controller.abort();
    }
    const convId = replyAbortRef.current.convId || activeConversationId;
    setIsGeneratingReply(false);
    if (!convId) return;

    try {
      const partialReply =
        '### Partial Derivation (Interrupted)\n\nLet $\\mathbf{z}^{(l)} = \\mathbf{W}^{(l)}\\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}$... *(generation stopped by user)*';
      await fetch(`/api/chattyfi/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: partialReply,
          generationStatus: 'interrupted',
          processingStatus: 'blocked_incomplete',
          processingMetadata: {
            error_message: 'Stopped by user before completion',
          },
        }),
      });
      await fetchConversationDetail(convId);
      await fetchConversations(conversationSearchQuery);
      showToast('Generation stopped — marked incomplete (Safeguard 5)', 'info');
    } catch (err) {
      console.error('Error recording interrupted message:', err);
    }
  };

  const handleRegenerateChatMessage = async () => {
    const userTurns = (conversationMessages || []).filter((m) => m.role === 'user');
    const lastUserTurn = userTurns[userTurns.length - 1];
    if (!lastUserTurn || !activeConversationId) return;

    setIsGeneratingReply(true);
    const abortCtrl = new AbortController();
    replyAbortRef.current = { aborted: false, pendingPrompt: lastUserTurn.content, convId: activeConversationId, controller: abortCtrl };
    try {
      const activeProvider = aiConfig?.activeProvider || 'groq';
      const activeModel =
        aiConfig?.models?.[activeProvider] || aiConfig?.activeModel || 'openai/gpt-oss-120b';

      try {
        const replyRes = await fetch(`/api/chattyfi/conversations/${activeConversationId}/reply`, {
          method: 'POST',
          signal: abortCtrl.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-ai-provider': activeProvider,
            'x-ai-key': aiConfig?.keys?.[activeProvider] || '',
            'x-ai-model': activeModel,
            'x-ai-base-url': aiConfig?.baseUrls?.[activeProvider] || '',
          },
          body: JSON.stringify({ prompt: lastUserTurn.content }),
        });

        if (replyAbortRef.current.aborted) {
          return;
        }

        if (replyRes.ok) {
          await fetchConversationDetail(activeConversationId);
          await fetchConversations(conversationSearchQuery);
          showToast('Response regenerated', 'success');
          return;
        }
      } catch (backendReplyErr) {
        if (backendReplyErr.name === 'AbortError' || replyAbortRef.current.aborted) {
          return;
        }
        console.warn('Backend regenerate reply failed, using contract fallback:', backendReplyErr);
      }

      const assistantMarkdown = buildStage3StructuredReply(lastUserTurn.content, files);

      await fetch(`/api/chattyfi/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: assistantMarkdown,
          generationStatus: 'completed',
          processingStatus: 'pending',
          processingMetadata: {
            provider: activeProvider,
            model: activeModel,
          },
        }),
      });
      await fetchConversationDetail(activeConversationId);
      await fetchConversations(conversationSearchQuery);
      showToast('Response regenerated', 'success');
    } catch (err) {
      showToast('Failed to regenerate response', 'error');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleLoadDemoConversation = async () => {
    try {
      const created = await handleCreateConversation(
        'Backpropagation, Chain Rule & Virtual Memory Walk'
      );
      if (!created) return;

      const userPrompt1 =
        'Explain how backpropagation computes gradients through a multi-layer perceptron. Include the matrix chain rule in LaTeX, a clean Python implementation of a single layer pass, and connect it to [[Neural Networks | mathematically grounds | Backpropagation]].';

      await fetch(`/api/chattyfi/conversations/${created.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: userPrompt1,
          generationStatus: 'completed',
          processingStatus: 'pending',
          processingMetadata: {
            attachments: [
              {
                file_name: 'lecture_04_backprop_notes.md',
                file_type: 'document',
                mime_type: 'text/markdown',
                file_size: 4820,
                storage_path: 'uploads/lecture_04_backprop_notes.md',
                extracted_text:
                  '# Lecture 4: Backpropagation & Matrix Calculus\nChain rule over computational graphs.',
              },
            ],
          },
        }),
      });

      const assistantReply1 = buildStage3StructuredReply(userPrompt1, files);
      await fetch(`/api/chattyfi/conversations/${created.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: assistantReply1,
          generationStatus: 'completed',
          processingStatus: 'completed',
          processingMetadata: {
            provider: aiConfig?.activeProvider || 'groq',
            model: aiConfig?.activeModel || 'openai/gpt-oss-120b',
          },
        }),
      });

      await fetch(`/api/chattyfi/conversations/${created.id}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicName: 'Neural Networks',
          summary: 'Backpropagation, matrix chain rule, and gradient flow',
          matchConfidence: 0.92,
        }),
      });

      await fetchConversationDetail(created.id);
      await fetchConversations(conversationSearchQuery);
      showToast('Loaded rich study thread with Markdown, LaTeX, Code & Attachments', 'success');
    } catch (err) {
      showToast('Failed to load demo thread', 'error');
    }
  };

  const handleCaptureMessage = async (message, resolutionAction = null, explicitTargetId = null) => {
    if (!activeConversationId || !message?.id) return;
    setCapturingMessageId(message.id);
    try {
      const payload = {
        messageId: message.id,
      };
      if (resolutionAction) {
        payload.resolutionAction = resolutionAction;
        if (explicitTargetId) payload.explicitTargetId = explicitTargetId;
      }

      const res = await fetch(`/api/chattyfi/conversations/${activeConversationId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to capture message');
      }

      if (data.status === 'ambiguous_match') {
        setAmbiguousMatchData({
          message,
          matches: data.matches || [],
          topMatch: data.topMatch || null,
        });
        return;
      }

      setAmbiguousMatchData(null);
      showToast(
        data.status === 'appended_existing'
          ? `Appended insights to [[${data.file?.title}]]`
          : `Captured note [[${data.file?.title}]] to vault!`,
        'success'
      );

      await fetchFiles();
      await fetchGlobalGraph();
      await fetchConversationDetail(activeConversationId);
    } catch (err) {
      console.error('Error capturing message to vault:', err);
      showToast(err.message || 'Capture failed', 'error');
    } finally {
      setCapturingMessageId(null);
    }
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
        setActiveFile({ ...newFile, links: [], companionNote: null });
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
          className={`fixed top-4 right-4 z-50 px-3.5 py-2 rounded-lg shadow-lg text-xs font-medium border flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${toast.type === 'success'
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

      {/* Left Pane: Vault Explorer or ChattyFi Conversation Sidebar */}
      <div
        className={`${isSidebarOpen
          ? 'fixed inset-y-0 left-0 z-40 w-72 md:relative md:w-64 md:z-auto md:flex shrink-0 h-full shadow-xl md:shadow-none'
          : 'hidden'
          }`}
      >
        <ErrorBoundary>
          {workspaceMode === 'chattyfi' ? (
            <ConversationSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                window.location.hash = `#/chattyfi/${id}`;
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              onCreateConversation={() => handleCreateConversation('Untitled Conversation')}
              onRenameConversation={handleRenameConversation}
              onTogglePinConversation={handleTogglePinConversation}
              onDeleteConversation={handleDeleteConversation}
              searchQuery={conversationSearchQuery}
              onSearchChange={setConversationSearchQuery}
              workspaceMode={workspaceMode}
              onSwitchWorkspaceMode={handleSwitchWorkspaceMode}
              onOpenFullGraph={() => {
                setIsFullscreenGraph(true);
                setIsRightPanelOpen(true);
              }}
              files={files}
              onSelectFile={(id) => {
                handleSelectFile(id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
              theme={theme}
              onToggleTheme={toggleTheme}
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onReturnToLanding={handleReturnToLanding}
              isLoading={isLoadingConversations}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
            />
          ) : (
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
              workspaceMode={workspaceMode}
              onSwitchWorkspaceMode={handleSwitchWorkspaceMode}
              onOpenFullGraph={() => {
                setIsFullscreenGraph(true);
                setIsRightPanelOpen(true);
              }}
              theme={theme}
              onToggleTheme={toggleTheme}
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onReturnToLanding={handleReturnToLanding}
              currentUser={currentUser}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Center Pane: ChattyFi Conversation Interface or Markdown Editor */}
      <ErrorBoundary>
        {workspaceMode === 'chattyfi' ? (
          <ChattyFiView
            conversation={activeConversation}
            messages={conversationMessages}
            files={files}
            onSendMessage={handleSendChatMessage}
            onStopGeneration={handleStopChatGeneration}
            onRegenerateMessage={handleRegenerateChatMessage}
            onLoadDemoConversation={handleLoadDemoConversation}
            onRenameConversation={handleRenameConversation}
            onCreateConversation={() => handleCreateConversation('Untitled Conversation')}
            onSwitchToNotes={() => handleSwitchWorkspaceMode('notes')}
            onOpenNoteByTitle={handleOpenNoteByTitle}
            onOpenNoteById={handleOpenNoteById}
            onOpenFullGraph={() => {
              setIsFullscreenGraph(true);
              setIsRightPanelOpen(true);
            }}
            onOpenAIConfig={() => setIsAIConfigOpen(true)}
            aiConfig={aiConfig}
            isGenerating={isGeneratingReply}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isRightPanelOpen={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            onReturnToLanding={handleReturnToLanding}
            onCaptureMessage={handleCaptureMessage}
            capturingMessageId={capturingMessageId}
          />
        ) : (
          <Editor
            file={activeFile}
            files={files}
            onSave={handleSaveFile}
            onProcessAI={handleProcessAI}
            isAIProcessing={isAIProcessing}
            onOpenFullGraph={() => {
              setIsFullscreenGraph(true);
              setIsRightPanelOpen(true);
            }}
            onOpenSynthesis={handleOpenSynthesis}
            onOpenAIConfig={() => setIsAIConfigOpen(true)}
            aiConfig={aiConfig}
            onNavigateToFile={handleSelectFile}
            onOpenNoteByTitle={handleOpenNoteByTitle}
            theme={theme}
            onToggleTheme={toggleTheme}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isRightPanelOpen={isRightPanelOpen}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            onReturnToLanding={handleReturnToLanding}
            onSwitchToChattyFi={() => handleSwitchWorkspaceMode('chattyfi')}
          />
        )}
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
        className={`${isRightPanelOpen
          ? 'fixed inset-y-0 right-0 z-40 w-80 lg:relative lg:z-auto lg:flex flex-col h-full bg-[#F0F1ED] dark:bg-[#151518] border-l border-[#E3E5DF] dark:border-[#26262c] overflow-hidden shrink-0 shadow-xl lg:shadow-none'
          : 'hidden'
          }`}
      >
        <ErrorBoundary>
          <GraphView
            graphData={graphData}
            globalGraphData={globalGraphData}
            activeFileId={activeFileId}
            activeConversationId={activeConversationId}
            workspaceMode={workspaceMode}
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

      {/* Account Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
      />

      {/* Ambiguous Match Resolution Modal */}
      {ambiguousMatchData && (
        <div
          onClick={() => setAmbiguousMatchData(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FAF9F5] dark:bg-[#15161A] border border-[#E3E5DF] dark:border-[#272A32] rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-500">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#242824] dark:text-[#F4F4F5]">
                    Similar Vault Note Detected
                  </h3>
                  <p className="text-xs text-[#666B65] dark:text-[#A1A1AA]">
                    Nexus Vault found closely related notes in your knowledge base
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAmbiguousMatchData(null)}
                className="p-1 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-[#4A4F49] dark:text-[#D4D4D8] leading-relaxed">
                We found existing note{' '}
                <strong className="text-[#242824] dark:text-[#F4F4F5] font-semibold">
                  [[{ambiguousMatchData.topMatch?.title}]]
                </strong>{' '}
                with{' '}
                <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                  {Math.round((ambiguousMatchData.topMatch?.match_confidence || 0) * 100)}%
                </span>{' '}
                concept similarity. Choose how to structure this knowledge:
              </p>

              {ambiguousMatchData.matches && ambiguousMatchData.matches.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ambiguousMatchData.matches.map((m) => (
                    <div
                      key={m.file_id}
                      className="p-3 rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#1A1B20] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-[#242824] dark:text-[#F4F4F5] truncate block">
                          [[{m.title}]]
                        </span>
                        <span className="text-[11px] text-[#878C85] dark:text-[#71717A] font-mono">
                          Confidence: {Math.round(m.match_confidence * 100)}% • {m.match_zone}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleCaptureMessage(
                            ambiguousMatchData.message,
                            'append_existing',
                            m.file_id
                          )
                        }
                        className="px-2.5 py-1 rounded bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-medium shrink-0 transition-colors cursor-pointer"
                      >
                        Append Here
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-[#E3E5DF] dark:border-[#272A32] bg-[#F0F1ED] dark:bg-[#111113] flex items-center justify-between gap-2">
              <button
                onClick={() =>
                  handleCaptureMessage(ambiguousMatchData.message, 'create_new')
                }
                className="px-3 py-1.5 rounded-lg border border-[#E3E5DF] dark:border-[#2E2E36] bg-white dark:bg-[#1C1C22] hover:bg-[#E8EAE4] dark:hover:bg-[#282832] text-[#242824] dark:text-[#E4E4E7] text-xs font-medium transition-colors cursor-pointer"
              >
                Create as New Note
              </button>
              <button
                onClick={() => setAmbiguousMatchData(null)}
                className="px-3 py-1.5 text-xs text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

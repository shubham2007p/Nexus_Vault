import React, { useEffect, useRef, useState, useMemo } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { linkHighlightPlugin } from '../extensions/codemirrorLinkPlugin';
import { createSlashCommandExtension } from '../extensions/slashCommandExtension';
import SlashCommandMenu from './editor/SlashCommandMenu';
import MarkdownRenderer from './shared/MarkdownRenderer';
import {
  Sparkles,
  Save,
  Check,
  Clock,
  FileText,
  Network,
  ExternalLink,
  PanelLeft,
  PanelRight,
  Link2,
  BookMarked,
  BookOpen,
  PenLine,
  Bot,
  ArrowLeft,
} from 'lucide-react';

export default function Editor({
  file,
  files = [],
  onSave,
  onProcessAI,
  isAIProcessing,
  onOpenFullGraph,
  onOpenSynthesis,
  onOpenAIConfig,
  aiConfig,
  onNavigateToFile,
  onOpenNoteByTitle,
  theme = 'light',
  isSidebarOpen,
  onToggleSidebar,
  isRightPanelOpen,
  onToggleRightPanel,
  onReturnToLanding,
  onSwitchToChattyFi,
}) {
  const editorContainerRef = useRef(null);
  const viewRef = useRef(null);
  const themeCompartment = useRef(new Compartment());
  const lastFileIdRef = useRef(null);
  const isDirtyRef = useRef(false);

  const [slashMenuState, setSlashMenuState] = useState({
    isOpen: false,
    coords: null,
    query: '',
    from: 0,
    to: 0,
    lineStart: false,
  });
  const slashMenuStateRef = useRef(slashMenuState);
  slashMenuStateRef.current = slashMenuState;

  const slashExtension = useMemo(
    () =>
      createSlashCommandExtension({
        onTrigger: (data) => {
          if (data.onlyUpdateCoords) {
            setSlashMenuState((prev) => (prev.isOpen ? { ...prev, coords: data.coords } : prev));
          } else {
            setSlashMenuState({
              isOpen: true,
              coords: data.coords,
              query: data.query,
              from: data.from,
              to: data.to,
              lineStart: data.lineStart,
            });
          }
        },
        onClose: () => {
          setSlashMenuState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
        },
        onKeyAction: (action) => {
          if (window.__nexusSlashKeyAction) {
            return window.__nexusSlashKeyAction(action);
          }
          return false;
        },
        isMenuOpen: () => slashMenuStateRef.current.isOpen,
      }),
    []
  );

  const isInitialEmpty = !file || !file.content || file.content.trim() === '';
  const [viewMode, setViewMode] = useState(isInitialEmpty ? 'edit' : 'read'); // 'read' | 'edit'
  const [title, setTitle] = useState(file ? file.title : '');
  const [content, setContent] = useState(file ? file.content : '');
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'dirty' | 'saving'
  const [wordCount, setWordCount] = useState(0);

  const updateWordCount = (text) => {
    if (!text || text.trim() === '') {
      setWordCount(0);
      return;
    }
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };

  const buildEditorState = (docText = '') =>
    EditorState.create({
      doc: docText,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        themeCompartment.current.of(theme === 'dark' ? oneDark : []),
        linkHighlightPlugin,
        ...slashExtension,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newText = update.state.doc.toString();
            isDirtyRef.current = true;
            setContent(newText);
            setSaveState('dirty');
            updateWordCount(newText);
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '14.5px',
            fontFamily: '"IBM Plex Mono", "JetBrains Mono", Menlo, Consolas, monospace',
            letterSpacing: '0.01em',
          },
          '.cm-content': {
            padding: '24px 32px 120px 32px',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.8',
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
          '&.cm-focused': {
            outline: 'none',
          },
        }),
      ],
    });

  // Initialize CodeMirror instance when container & file are ready, or update doc on note switch
  useEffect(() => {
    if (!editorContainerRef.current || !file) {
      if (!file && viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
        lastFileIdRef.current = null;
      }
      return;
    }

    const isFileSwitch = lastFileIdRef.current !== file.id;
    const incomingContent = file.content || '';

    if (!viewRef.current) {
      // First mount with active file: create CodeMirror instance
      const startState = buildEditorState(incomingContent);
      const view = new EditorView({
        state: startState,
        parent: editorContainerRef.current,
      });
      viewRef.current = view;
    } else if (isFileSwitch) {
      // Switching to a different note: reset EditorState so each note has clean undo/redo history
      viewRef.current.setState(buildEditorState(incomingContent));
    } else {
      // Same note (e.g. updated_at changed after autosave or external link acceptance):
      // Only dispatch if not dirty and the document actually differs, preserving CodeMirror undo history!
      const currentDoc = viewRef.current.state.doc.toString();
      if (!isDirtyRef.current && currentDoc !== incomingContent) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: incomingContent },
        });
      }
    }

    if (isFileSwitch) {
      lastFileIdRef.current = file.id;
      isDirtyRef.current = false;
      const isEmptyNote = !incomingContent || incomingContent.trim() === '';
      setViewMode(isEmptyNote ? 'edit' : 'read');
      setTitle(file.title || '');
      setContent(incomingContent);
      setSaveState('saved');
      updateWordCount(incomingContent);
      if (isEmptyNote) {
        requestAnimationFrame(() => {
          viewRef.current?.requestMeasure();
          viewRef.current?.focus();
        });
      }
    } else if (!isDirtyRef.current) {
      setTitle(file.title || '');
      setContent(incomingContent);
      setSaveState('saved');
      updateWordCount(incomingContent);
    }
  }, [file?.id, file?.updated_at]);

  // Recalculate CodeMirror layout & geometry when switching from Reading View to Edit View
  useEffect(() => {
    if (viewMode === 'edit' && viewRef.current) {
      requestAnimationFrame(() => {
        if (viewRef.current) {
          viewRef.current.requestMeasure();
        }
      });
    }
  }, [viewMode]);

  // Keyboard shortcuts: Ctrl/Cmd+E toggles Reading/Edit View, Ctrl/Cmd+S saves immediately
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!file) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setViewMode((prev) => {
          const next = prev === 'read' ? 'edit' : 'read';
          if (next === 'edit') {
            requestAnimationFrame(() => {
              viewRef.current?.requestMeasure();
              viewRef.current?.focus();
            });
          }
          return next;
        });
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file?.id, saveState, title, content]);

  // Clean up CodeMirror on unmount
  useEffect(() => {
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // Update theme dynamically
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : []),
      });
    }
  }, [theme]);

  // Autosave Debounce (1000ms)
  useEffect(() => {
    if (!file) return;

    const timer = setTimeout(async () => {
      if (saveState === 'dirty' && file) {
        try {
          setSaveState('saving');
          await onSave(file.id, { title, content });
          isDirtyRef.current = false;
          setSaveState('saved');
        } catch (err) {
          console.error('Autosave failed:', err);
          setSaveState('dirty');
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, title, saveState, file?.id]);

  const handleManualSave = async () => {
    if (file && saveState === 'dirty') {
      setSaveState('saving');
      await onSave(file.id, { title, content });
      isDirtyRef.current = false;
      setSaveState('saved');
    }
  };

  const handleSwitchToMode = (nextMode) => {
    setViewMode(nextMode);
    if (nextMode === 'edit') {
      requestAnimationFrame(() => {
        viewRef.current?.requestMeasure();
        viewRef.current?.focus();
      });
    } else {
      setSlashMenuState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#15161A] select-none">
        {(!isSidebarOpen || onReturnToLanding) && (
          <div className="h-12 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#F7F7F4] dark:bg-[#18191E] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {onToggleSidebar && !isSidebarOpen && (
                <button
                  onClick={onToggleSidebar}
                  className="p-1.5 rounded-md text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer shrink-0"
                  title="Show Files Sidebar"
                  aria-label="Show sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}
              {onReturnToLanding && !isSidebarOpen && (
                <button
                  onClick={onReturnToLanding}
                  className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#666B65] dark:text-[#A1A1AA] hover:text-[#287D54] dark:hover:text-emerald-400 border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0 group"
                  title="Return to Website Overview"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                  <span>Website Overview</span>
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#878C85] dark:text-[#71717A]">
          <div className="w-12 h-12 rounded-xl bg-[#F0F1ED] dark:bg-[#1E1F24] border border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-center mb-4 text-[#4A4F49] dark:text-[#A1A1AA]">
            <FileText className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-semibold text-[#242824] dark:text-[#D4D4D8] mb-1">
            No Note Selected
          </h3>
          <p className="text-xs text-[#878C85] dark:text-[#71717A] max-w-xs leading-relaxed">
            Select a note from the sidebar or click <kbd className="px-1.5 py-0.5 rounded bg-[#EAECE6] dark:bg-[#202227] border border-[#E3E5DF] dark:border-[#2E313B] font-mono text-[10px] text-[#4A4F49] dark:text-[#D4D4D8]">New</kbd> to begin.
          </p>
        </div>
      </div>
    );
  }

  const isFormalNote = file.note_type === 'formal';
  const companion = file.companionNote;

  // Active AI Provider info
  const activeProvider = aiConfig?.activeProvider || 'groq';
  const providerNames = {
    groq: 'Groq LPU',
    anthropic: 'Claude',
    openai: 'OpenAI (ChatGPT)',
    gemini: 'Google Gemini',
    openrouter: 'OpenRouter',
    mistral: 'Mistral AI',
    custom: 'Local / Custom',
  };
  const activeProviderLabel = providerNames[activeProvider] || activeProvider;
  const hasActiveKey = Boolean(aiConfig?.keys?.[activeProvider] && aiConfig?.keys?.[activeProvider].trim() !== '');

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#15161A] overflow-hidden select-text">
      {/* Top Action Bar */}
      <div className="h-12 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#F7F7F4] dark:bg-[#18191E] px-4 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left: Sidebar toggle, Note Title Input & Save Status */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Hide Files Sidebar' : 'Show Files Sidebar'}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {!isSidebarOpen && onReturnToLanding && (
            <button
              onClick={onReturnToLanding}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#666B65] dark:text-[#A1A1AA] hover:text-[#287D54] dark:hover:text-emerald-400 border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0 group"
              title="Return to Website Overview"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="hidden sm:inline font-medium">Website Overview</span>
            </button>
          )}

          <input
            type="text"
            size={1}
            value={title}
            onChange={(e) => {
              isDirtyRef.current = true;
              setTitle(e.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled Note..."
            className="bg-transparent text-sm md:text-base font-semibold text-[#242824] dark:text-[#F4F4F5] focus:outline-none w-full min-w-[80px] flex-1 max-w-[240px] truncate placeholder-[#878C85] dark:placeholder-[#71717A]"
          />

          {/* Unobtrusive Save Status */}
          <div data-testid="editor-save-status" className="hidden md:flex items-center gap-2 text-xs shrink-0">
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-[#E7A23B] dark:text-amber-400 font-medium">
                <Clock className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-[#287D54] dark:text-emerald-400 font-medium">
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
            {saveState === 'dirty' && (
              <span className="text-[#878C85] dark:text-[#71717A] text-xs font-mono">• Unsaved</span>
            )}

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#4A4F49] dark:text-[#A1A1AA] border-l border-[#E3E5DF] dark:border-[#272A32] pl-2">
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Reading / Edit View Mode Segmented Switcher */}
          <div
            data-testid="note-view-mode-switcher"
            className="flex items-center p-0.5 rounded-lg bg-[#EAECE6] dark:bg-[#1E1F24] border border-[#E3E5DF] dark:border-[#272A32] mr-0.5"
          >
            <button
              type="button"
              data-testid="note-mode-read"
              onClick={() => handleSwitchToMode('read')}
              aria-pressed={viewMode === 'read'}
              className={`h-6 px-2.5 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'read'
                  ? 'bg-white dark:bg-[#272930] text-[#287D54] dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] font-medium'
              }`}
              title="Reading View — Rendered Markdown, LaTeX & Wiki Links (Ctrl+E)"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Reading</span>
            </button>
            <button
              type="button"
              data-testid="note-mode-edit"
              onClick={() => handleSwitchToMode('edit')}
              aria-pressed={viewMode === 'edit'}
              className={`h-6 px-2.5 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-[#272930] text-[#287D54] dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] font-medium'
              }`}
              title="Edit View — Raw Markdown Source Editor (Ctrl+E)"
            >
              <PenLine className="w-3.5 h-3.5 shrink-0" />
              <span>Edit</span>
            </button>
          </div>

          {/* Switch to ChattyFi Interface Button */}
          {onSwitchToChattyFi && (
            <button
              onClick={onSwitchToChattyFi}
              className="h-7 px-2 rounded-md bg-[#EBF5F0] dark:bg-emerald-950/60 hover:bg-[#DCEEE5] dark:hover:bg-emerald-900/60 text-[#1F6342] dark:text-emerald-300 border border-[#287D54]/30 dark:border-emerald-500/35 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open ChattyFi Conversational Knowledge Capture"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden 2xl:inline">ChattyFi</span>
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleManualSave}
            disabled={saveState === 'saved'}
            className="h-7 px-2 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] disabled:opacity-35 transition-colors border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Save Note (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-[#4A4F49] dark:text-[#A1A1AA]" />
            <span className="hidden 2xl:inline">Save</span>
          </button>

          {/* AI / Robot Model & API Key Configuration Button (Right next to Save button) */}
          <button
            onClick={onOpenAIConfig}
            className="h-7 px-2 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors group relative"
            title={`Configure AI Models & API Keys (Active: ${activeProviderLabel})`}
          >
            <Bot className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden 2xl:inline font-medium">AI Model</span>
            {hasActiveKey && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Active API key configured" />
            )}
          </button>

          {/* Academic Synthesis Action Button */}
          {onOpenSynthesis && (
            <button
              onClick={() => onOpenSynthesis(file)}
              className="h-7 px-2.5 rounded-md bg-[#FEF7EC] dark:bg-[#2B2317] hover:bg-[#FDEED3] dark:hover:bg-[#382C1B] text-[#9A6214] dark:text-amber-300 border border-[#E7A23B]/40 dark:border-amber-500/35 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title={
                isFormalNote
                  ? `Re-synthesize this formal companion note with ${activeProviderLabel}`
                  : `Synthesize raw note into textbook-grade formal note with ${activeProviderLabel}`
              }
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E7A23B] dark:text-amber-400" />
              <span className="hidden xl:inline">{isFormalNote ? 'Regenerate' : 'Synthesize'}</span>
            </button>
          )}

          {/* AI Backlink Discovery */}
          <button
            onClick={() => onProcessAI(file.id)}
            disabled={isAIProcessing}
            className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E24] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#E4E4E7] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-40"
            title={`Discover AI link recommendations with ${activeProviderLabel}`}
          >
            {isAIProcessing ? (
              <span className="w-3 h-3 border-2 border-[#287D54] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Link2 className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
            )}
            <span className="hidden xl:inline">{isAIProcessing ? 'Discovering...' : 'Discover Links'}</span>
          </button>

          {/* Toggle Fullscreen Graph View */}
          {onOpenFullGraph && (
            <button
              onClick={onOpenFullGraph}
              className="h-7 px-2 rounded-md bg-white dark:bg-[#1E1E24] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Expand to Fullscreen Graph (G)"
            >
              <Network className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden 2xl:inline">Graph</span>
            </button>
          )}

          {/* Right Panel (Backlinks & Inspector) Toggle */}
          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              className="p-1.5 rounded-md text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer shrink-0 ml-0.5"
              title={isRightPanelOpen ? 'Hide Backlinks & Graph' : 'Show Backlinks & Graph'}
              aria-label="Toggle right inspector panel"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subtle Companion Relationship Bar */}
      {companion && onNavigateToFile && (
        <div className="h-7 px-4 bg-[#F7F7F4] dark:bg-[#17181C] border-b border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#E3E5DF] dark:bg-[#272A32] text-[#4A4F49] dark:text-[#A1A1AA] font-medium">
              {isFormalNote ? 'Formal Companion' : 'Raw Notes'}
            </span>
            <span className="text-[#4A4F49] dark:text-[#A1A1AA] text-xs">
              {isFormalNote ? 'Derived from original note:' : 'Companion textbook note:'}
            </span>
            <button
              onClick={() => onNavigateToFile(companion.id)}
              className="font-medium text-[#287D54] dark:text-emerald-400 hover:underline flex items-center gap-1 truncate cursor-pointer"
              title={`Switch to ${companion.title}`}
            >
              <span className="truncate">"{companion.title}"</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </button>
          </div>

          <span className="text-xs text-[#4A4F49] dark:text-[#71717A] font-mono hidden lg:inline shrink-0 pl-2">
            Linked in Graph
          </span>
        </div>
      )}

      {/* Reading View (Rendered Markdown via shared MarkdownRenderer) */}
      {viewMode === 'read' && (
        <div
          data-testid="note-reading-view"
          className="flex-1 overflow-y-auto bg-white dark:bg-[#15161A] transition-colors"
        >
          <div className="max-w-[800px] mx-auto px-6 sm:px-10 py-8 pb-28 font-mono">
            {content && content.trim() !== '' ? (
              <MarkdownRenderer
                content={content}
                files={files}
                variant="note"
                onNavigateToNote={(noteId) => onNavigateToFile && onNavigateToFile(noteId)}
                onOpenNote={(targetTitle) => onOpenNoteByTitle && onOpenNoteByTitle(targetTitle)}
              />
            ) : (
              <div className="py-12 text-center border border-dashed border-[#E3E5DF] dark:border-[#272A32] rounded-xl bg-[#FAF9F6] dark:bg-[#18191E]">
                <p className="text-sm text-[#666B65] dark:text-[#A1A1AA] mb-3">
                  This note is currently empty.
                </p>
                <button
                  type="button"
                  onClick={() => handleSwitchToMode('edit')}
                  className="h-8 px-3.5 rounded-lg bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Start Writing in Edit View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit View (Persistent CodeMirror 6 Container — stays mounted to preserve undo/redo history) */}
      <div
        data-testid="note-edit-view"
        className={
          viewMode === 'edit'
            ? 'flex-1 overflow-auto bg-white dark:bg-[#15161A] transition-colors'
            : 'hidden'
        }
        ref={editorContainerRef}
      />

      {/* Notion-Style Floating Slash Command Menu */}
      {viewMode === 'edit' && slashMenuState.isOpen && (
        <SlashCommandMenu
          isOpen={slashMenuState.isOpen}
          coords={slashMenuState.coords}
          query={slashMenuState.query}
          from={slashMenuState.from}
          to={slashMenuState.to}
          lineStart={slashMenuState.lineStart}
          view={viewRef.current}
          onClose={() => setSlashMenuState((prev) => ({ ...prev, isOpen: false }))}
          theme={theme}
          noteTitle={title}
        />
      )}
    </div>
  );
}

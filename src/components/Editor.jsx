import React, { useEffect, useRef, useState } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { linkHighlightPlugin } from '../extensions/codemirrorLinkPlugin';
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
  Bot,
  ArrowLeft,
} from 'lucide-react';

export default function Editor({
  file,
  onSave,
  onProcessAI,
  isAIProcessing,
  onOpenFullGraph,
  onOpenSynthesis,
  onOpenAIConfig,
  aiConfig,
  onNavigateToFile,
  theme = 'light',
  isSidebarOpen,
  onToggleSidebar,
  isRightPanelOpen,
  onToggleRightPanel,
  onReturnToLanding,
}) {
  const editorContainerRef = useRef(null);
  const viewRef = useRef(null);
  const themeCompartment = useRef(new Compartment());

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

  // Initialize CodeMirror instance when container & file are ready, or update doc on note switch
  useEffect(() => {
    if (!editorContainerRef.current || !file) {
      if (!file && viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      return;
    }

    if (!viewRef.current) {
      // First mount with active file: create CodeMirror instance
      const startState = EditorState.create({
        doc: file.content || '',
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
          themeCompartment.current.of(theme === 'dark' ? oneDark : []),
          linkHighlightPlugin,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newText = update.state.doc.toString();
              setContent(newText);
              setSaveState('dirty');
              updateWordCount(newText);
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              fontSize: '15px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            '.cm-content': {
              padding: '24px 32px 120px 32px',
              maxWidth: '820px',
              margin: '0 auto',
              lineHeight: '1.75',
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

      const view = new EditorView({
        state: startState,
        parent: editorContainerRef.current,
      });

      viewRef.current = view;
    } else {
      // View already exists: synchronize document if switching files or receiving external updates
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== file.content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: file.content || '' },
        });
      }
    }

    setTitle(file.title || '');
    setContent(file.content || '');
    setSaveState('saved');
    updateWordCount(file.content || '');
  }, [file?.id, file?.updated_at]);

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
      setSaveState('saved');
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
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled Note..."
            className="bg-transparent text-sm md:text-base font-semibold text-[#242824] dark:text-[#F4F4F5] focus:outline-none max-w-xs md:max-w-md truncate placeholder-[#878C85] dark:placeholder-[#71717A]"
          />

          {/* Unobtrusive Save Status */}
          <div className="flex items-center gap-2 text-xs shrink-0">
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
          {/* Save Button */}
          <button
            onClick={handleManualSave}
            disabled={saveState === 'saved'}
            className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] disabled:opacity-35 transition-colors border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Save Note (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5 text-[#4A4F49] dark:text-[#A1A1AA]" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* AI / Robot Model & API Key Configuration Button (Right next to Save button) */}
          <button
            onClick={onOpenAIConfig}
            className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors group relative"
            title={`Configure AI Models & API Keys (Active: ${activeProviderLabel})`}
          >
            <Bot className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-medium">AI Model</span>
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
              <span>{isFormalNote ? 'Regenerate Formal' : 'Synthesize Note'}</span>
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
            <span className="hidden sm:inline">{isAIProcessing ? 'Discovering...' : 'Discover Links'}</span>
          </button>

          {/* Toggle Fullscreen Graph View */}
          {onOpenFullGraph && (
            <button
              onClick={onOpenFullGraph}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E24] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Expand to Fullscreen Graph (G)"
            >
              <Network className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden sm:inline">Graph</span>
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
          <div className="flex items-center gap-2 truncate">
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

          <span className="text-xs text-[#4A4F49] dark:text-[#71717A] font-mono hidden md:inline">
            Linked in Graph
          </span>
        </div>
      )}

      {/* Writing Canvas (CodeMirror Container) */}
      <div className="flex-1 overflow-auto bg-white dark:bg-[#15161A] transition-colors" ref={editorContainerRef} />
    </div>
  );
}

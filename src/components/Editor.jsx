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
  BookMarked
} from 'lucide-react';

export default function Editor({
  file,
  onSave,
  onProcessAI,
  isAIProcessing,
  onOpenFullGraph,
  onOpenSynthesis,
  onNavigateToFile,
  theme = 'light',
  isSidebarOpen,
  onToggleSidebar,
  isRightPanelOpen,
  onToggleRightPanel,
}) {
  const editorContainerRef = useRef(null);
  const editorViewRef = useRef(null);
  const themeCompartment = useRef(new Compartment());
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (file) {
      setTitle(file.title || '');
      setContent(file.content || '');
      setSaveState('saved');
    }
  }, [file?.id]);

  // CodeMirror Initialization
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const startState = EditorState.create({
      doc: file?.content || '',
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        themeCompartment.current.of(theme === 'dark' ? oneDark : []),
        linkHighlightPlugin,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newDoc = update.state.doc.toString();
            setContent(newDoc);
            setSaveState('dirty');
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [file?.id]);

  // Dynamically reconfigure CodeMirror theme when light/dark mode toggles
  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : []),
      });
    }
  }, [theme]);

  // Autosave Debounce (1000ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveState === 'dirty' && file) {
      const timer = setTimeout(async () => {
        setSaveState('saving');
        await onSave(file.id, { title, content });
        setSaveState('saved');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [content, title, saveState, file?.id]);

  const handleManualSave = async () => {
    if (file) {
      setSaveState('saving');
      await onSave(file.id, { title, content });
      setSaveState('saved');
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const linkMatches = (content.match(/\[\[[^\[\]]+\]\]/g) || []).length;

  const isFormalNote = file?.note_type === 'formal' || (file?.title && file.title.endsWith('(Formal)'));
  const companion = file?.companionNote;

  if (!file) {
    return (
      <div className="flex-1 bg-white dark:bg-[#15161A] flex flex-col items-center justify-center p-8 text-[#878C85] dark:text-[#71717A] select-none text-center transition-colors">
        <div className="w-12 h-12 rounded-xl bg-[#F0F1ED] dark:bg-[#1C1D22] border border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 text-[#878C85] dark:text-[#71717A]" />
        </div>
        <p className="text-sm font-semibold text-[#242824] dark:text-[#F4F4F5]">No Note Selected</p>
        <p className="text-xs text-[#666B65] dark:text-[#A1A1AA] mt-1 max-w-xs">
          Select a note from the left sidebar, use Quick Switcher (⌘K), or create a new note.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white dark:bg-[#15161A] flex flex-col h-full overflow-hidden transition-colors">
      {/* Semantic Screen Title */}
      <h1 className="sr-only">{title ? `${title} — Nexus Vault` : 'Note Workspace — Nexus Vault'}</h1>

      {/* Editor Header Toolbar */}
      <div className="h-12 px-4 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#F7F7F4] dark:bg-[#17181C] flex items-center justify-between shrink-0 gap-3 transition-colors">
        {/* Left: Sidebar toggle, Note Title Input & Save Status */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled Note"
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

        {/* Right: Restrained, Solid Action Controls */}
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

          {/* Groq Synthesis Action Button: Important secondary workflow, restrained amber */}
          {onOpenSynthesis && (
            <button
              onClick={() => onOpenSynthesis(file)}
              className="h-7 px-2.5 rounded-md bg-[#FEF7EC] dark:bg-[#2B2317] hover:bg-[#FDEED3] dark:hover:bg-[#382C1B] text-[#9A6214] dark:text-amber-300 border border-[#E7A23B]/40 dark:border-amber-500/35 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title={
                isFormalNote
                  ? 'Re-synthesize this formal companion note with Groq LPU'
                  : 'Synthesize raw note into textbook-grade formal note with Groq LPU'
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
            title="Discover AI link recommendations for this note"
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

      {/* Subtle Companion Relationship Bar (Non-Intrusive, Quiet) */}
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

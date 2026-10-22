import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
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
  ArrowUpRight,
  Network,
  Zap,
  BookOpen,
  ArrowLeftRight,
  ExternalLink
} from 'lucide-react';

export default function Editor({
  file,
  onSave,
  onProcessAI,
  isAIProcessing,
  onOpenFullGraph,
  onOpenSynthesis,
  onNavigateToFile,
}) {
  const editorContainerRef = useRef(null);
  const editorViewRef = useRef(null);
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

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const startState = EditorState.create({
      doc: file?.content || '',
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        oneDark,
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
      <div className="flex-1 bg-[#131316] flex flex-col items-center justify-center p-8 text-[#71717a] select-none text-center">
        <div className="w-12 h-12 rounded-xl bg-[#1b1b1f] border border-[#26262c] flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 text-[#52525b]" />
        </div>
        <p className="text-sm font-medium text-[#d4d4d8]">No Note Open</p>
        <p className="text-xs text-[#71717a] mt-1 max-w-xs">
          Select a note from the explorer, use Quick Switcher (⌘K), or create a new note.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#131316] flex flex-col h-full overflow-hidden border-r border-[#26262c]">
      {/* Accessible semantic heading for canvas */}
      <h1 className="sr-only">{title ? `${title} — Nexus Vault` : 'Note Workspace — Nexus Vault'}</h1>

      {/* Editor Header Toolbar */}
      <div className="h-12 px-6 border-b border-[#26262c] bg-[#141417] flex items-center justify-between shrink-0 gap-4">
        {/* Title Input & Save Metrics */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled Note"
            className="bg-transparent text-sm font-semibold text-[#f4f4f5] focus:outline-none focus:border-b-2 focus:border-purple-400 px-1 py-0.5 max-w-md truncate transition-all placeholder-[#71717a]"
          />

          <div className="flex items-center gap-2.5 text-xs">
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-amber-400 font-medium text-xs">
                <Clock className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {saveState === 'dirty' && (
              <span className="text-amber-400 text-xs font-mono">• Unsaved</span>
            )}

            <div className="hidden md:flex items-center gap-2 text-xs text-[#94a3b8] border-l border-[#2e2e36] pl-2.5 font-mono">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{linkMatches} links</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Full Graph, Save, Synthesize, Discover Links */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenFullGraph && (
            <button
              onClick={onOpenFullGraph}
              className="h-7 px-2.5 rounded-md bg-[#1e1e24] hover:bg-[#27272e] text-[#d4d4d8] hover:text-[#f4f4f5] transition-colors border border-[#2e2e36] text-xs font-medium flex items-center gap-1.5 focus:outline-none shadow-sm cursor-pointer"
              title="Expand to Full Screen Graph (G)"
            >
              <Network className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Graph</span>
            </button>
          )}

          <button
            onClick={handleManualSave}
            disabled={saveState === 'saved'}
            className="h-7 px-2.5 rounded-md bg-[#1e1e22] hover:bg-[#27272e] text-[#d4d4d8] disabled:opacity-30 transition-colors border border-[#2e2e36] text-xs font-medium flex items-center gap-1.5 focus:outline-none cursor-pointer"
            title="Save Note (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* GROQ NOTE SYNTHESIS BUTTON: High contrast (5.6:1) WCAG compliant */}
          {onOpenSynthesis && (
            <button
              onClick={() => onOpenSynthesis(file)}
              className="h-7 px-3 rounded-md bg-[#b45309] hover:bg-[#92400e] text-amber-50 font-semibold text-xs border border-amber-600/50 shadow-sm active:scale-[0.98] transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer"
              title={
                isFormalNote
                  ? 'Re-synthesize this formal companion note with Groq LPU'
                  : 'Synthesize raw note into textbook-grade formal note with Groq LPU'
              }
            >
              <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200/40" />
              <span>{isFormalNote ? 'Regenerate Formal' : 'Synthesize Note'}</span>
            </button>
          )}

          <button
            onClick={() => onProcessAI(file.id)}
            disabled={isAIProcessing}
            className="h-7 px-3 rounded-md bg-[#1e1e24] hover:bg-[#27272e] text-[#e4e4e7] hover:text-[#f4f4f5] font-medium text-xs border border-[#363640] shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer"
            title="Discover AI link proposals for this note"
          >
            {isAIProcessing ? (
              <span className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-0.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span className="hidden sm:inline">{isAIProcessing ? 'Discovering...' : 'Links'}</span>
          </button>
        </div>
      </div>

      {/* COMPANION NOTE LINK BANNER (Sentence case, WCAG compliant contrast) */}
      {companion && onNavigateToFile && (
        <div className="h-8 px-6 bg-[#16161a] border-b border-[#24242b] flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-2 truncate">
            {isFormalNote ? (
              <>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25 font-medium">
                  Formal note
                </span>
                <span className="text-[#94a3b8] text-xs">Companion to raw note:</span>
                <button
                  onClick={() => onNavigateToFile(companion.id)}
                  className="font-medium text-white hover:text-amber-300 transition-colors flex items-center gap-1 group truncate cursor-pointer"
                  title={`Jump to original student notes: ${companion.title}`}
                >
                  <span className="truncate">"{companion.title}"</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-amber-300 shrink-0" />
                </button>
              </>
            ) : (
              <>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-medium">
                  Raw note
                </span>
                <span className="text-[#94a3b8] text-xs">Academic companion note available:</span>
                <button
                  onClick={() => onNavigateToFile(companion.id)}
                  className="font-medium text-white hover:text-amber-300 transition-colors flex items-center gap-1 group truncate cursor-pointer"
                  title={`Open formal textbook note: ${companion.title}`}
                >
                  <span className="truncate">"{companion.title}"</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-amber-300 shrink-0" />
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-[#94a3b8] font-mono hidden md:block">
            Connected via Vault Graph
          </div>
        </div>
      )}

      {/* CodeMirror Mounting Container with Centered Editorial Layout */}
      <div className="flex-1 overflow-auto bg-[#131316]" ref={editorContainerRef} />
    </div>
  );
}

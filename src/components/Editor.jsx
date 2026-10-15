import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { linkHighlightPlugin } from '../extensions/codemirrorLinkPlugin';
import { Sparkles, Save, Check, Clock, FileText } from 'lucide-react';

export default function Editor({ file, onSave, onProcessAI, isAIProcessing }) {
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

  if (!file) {
    return (
      <div className="flex-1 bg-[#1e1e1e] flex flex-col items-center justify-center text-[#777777]">
        <FileText className="w-12 h-12 mb-3 text-[#444444]" />
        <p className="text-sm font-medium text-[#aaaaaa]">No Note Selected</p>
        <p className="text-xs text-[#666666] mt-1">Select a note from the explorer or create a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1e1e1e] flex flex-col h-full overflow-hidden border-r border-[#2e2e2e]">
      {/* Editor Header Bar */}
      <div className="px-5 py-2.5 border-b border-[#282828] bg-[#141414] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled Note"
            className="bg-transparent text-base font-semibold text-[#ffffff] focus:outline-none focus:border-b-2 focus:border-[#e2e8f0] px-1 py-0.5 max-w-md truncate transition-all"
          />
          <div className="flex items-center gap-2 text-xs text-[#888888]">
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            {saveState === 'dirty' && (
              <span className="text-amber-400/90 text-[11px] font-mono">• Unsaved</span>
            )}

            {/* Note Stats pill */}
            <span className="hidden sm:inline-flex items-center text-[11px] text-[#666666] border-l border-[#2e2e2e] pl-2.5">
              {content.trim() ? content.trim().split(/\s+/).length : 0} words
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSave}
            disabled={saveState === 'saved'}
            className="p-1.5 rounded bg-[#242424] hover:bg-[#303030] text-[#dcddde] disabled:opacity-30 transition-colors border border-[#333333]"
            title="Save Note (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          {/* Process File AI Button */}
          <button
            onClick={() => onProcessAI(file.id)}
            disabled={isAIProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#e2e8f0] hover:bg-white text-black font-semibold text-xs shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            title="Run AI Link Agent to discover connections"
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                isAIProcessing ? 'animate-spin text-amber-700' : 'text-amber-600'
              }`}
            />
            <span>{isAIProcessing ? 'Analyzing Connections...' : 'Process File'}</span>
          </button>
        </div>
      </div>

      {/* CodeMirror Mounting Container */}
      <div className="flex-1 overflow-auto" ref={editorContainerRef} />
    </div>
  );
}

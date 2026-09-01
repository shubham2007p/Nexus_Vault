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
      <div className="px-5 py-2.5 border-b border-[#2e2e2e] bg-[#181818] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled Note"
            className="bg-transparent text-base font-semibold text-[#ffffff] focus:outline-none focus:border-b focus:border-[#70a5fd] px-1 py-0.5 max-w-md"
          />
          <div className="flex items-center gap-1.5 text-xs text-[#999999]">
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            {saveState === 'dirty' && (
              <span className="text-amber-400/80 text-[11px] italic">• Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSave}
            disabled={saveState === 'saved'}
            className="p-1.5 rounded bg-[#2a2a2a] hover:bg-[#363636] text-[#dcddde] disabled:opacity-40 transition-colors border border-[#383838]"
            title="Save Note (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
          </button>

          {/* Process File AI Button */}
          <button
            onClick={() => onProcessAI(file.id)}
            disabled={isAIProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#70a5fd] hover:bg-[#5b94f0] text-black font-semibold text-xs shadow disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAIProcessing ? 'animate-spin' : ''}`} />
            <span>{isAIProcessing ? 'Analyzing...' : 'Process File'}</span>
          </button>
        </div>
      </div>

      {/* CodeMirror Mounting Container */}
      <div className="flex-1 overflow-auto" ref={editorContainerRef} />
    </div>
  );
}

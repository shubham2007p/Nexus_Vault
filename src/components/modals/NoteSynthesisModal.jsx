import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Check,
  X,
  AlertTriangle,
  FileText,
  Clock,
  BookOpen,
  ArrowRight,
  Code2,
  List,
  Link as LinkIcon,
  RotateCcw,
  History,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function NoteSynthesisModal({
  isOpen,
  onClose,
  file,
  onSynthesisSuccess,
  onNavigateToFile,
}) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'structured' | 'history'
  const [status, setStatus] = useState('idle'); // 'idle' | 'generating' | 'review' | 'saving' | 'conflict' | 'error'
  const [progressStep, setProgressStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Synthesis data
  const [previewData, setPreviewData] = useState(null);
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [existingNoteConflict, setExistingNoteConflict] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const steps = [
    'Preserving personal intuition and mental models...',
    'Querying Groq LPU (Llama 3.3 70B Versatile)...',
    'Deriving mathematical theorems & LaTeX expressions...',
    'Resolving cross-concept Vault wikilinks...',
  ];

  useEffect(() => {
    if (isOpen && file) {
      setStatus('idle');
      setPreviewData(null);
      setEditableMarkdown('');
      setErrorMessage('');
      setExistingNoteConflict(null);
      fetchHistory();
    }
  }, [isOpen, file?.id]);

  const fetchHistory = async () => {
    if (!file?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/files/${file.id}/synthesis-history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching synthesis history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const startPreviewSynthesis = async () => {
    if (!file?.id) return;
    setStatus('generating');
    setProgressStep(0);
    setErrorMessage('');

    const stepInterval = setInterval(() => {
      setProgressStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const res = await fetch(`/api/files/${file.id}/synthesize/preview`, {
        method: 'POST',
      });
      clearInterval(stepInterval);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize formal notes');
      }

      setPreviewData(data);
      setEditableMarkdown(data.previewMarkdown || '');
      setCustomTitle(data.formalTitle || `${file.title} (Formal)`);
      if (data.existingFormalNote) {
        setExistingNoteConflict(data.existingFormalNote);
      }
      setStatus('review');
      setActiveTab('preview');
    } catch (err) {
      clearInterval(stepInterval);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during synthesis');
    }
  };

  const handleSaveSynthesis = async (overwriteConfirmed = false) => {
    if (!file?.id || !editableMarkdown) return;
    setStatus('saving');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/files/${file.id}/synthesize/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renderedMarkdown: editableMarkdown,
          structuredOutput: previewData?.structuredOutput,
          formalTitle: customTitle,
          promptVersion: previewData?.promptVersion,
          model: previewData?.model,
          overwriteConfirmed,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Conflict: companion note exists and user hasn't explicitly confirmed
        setExistingNoteConflict(data.existingFormalNote);
        setStatus('conflict');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save companion note');
      }

      if (onSynthesisSuccess) {
        onSynthesisSuccess(data.formalFile, data.isUpdate);
      }
      onClose();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to save companion note');
    }
  };

  const handleQuickAutoSave = async (overwriteConfirmed = false) => {
    if (!file?.id) return;
    setStatus('generating');
    setProgressStep(0);
    setErrorMessage('');

    const stepInterval = setInterval(() => {
      setProgressStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await fetch(`/api/files/${file.id}/synthesize/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwriteConfirmed }),
      });
      clearInterval(stepInterval);
      const data = await res.json();

      if (res.status === 409) {
        setExistingNoteConflict(data.existingFormalNote);
        setStatus('conflict');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize note');
      }

      if (onSynthesisSuccess) {
        onSynthesisSuccess(data.formalFile, data.isUpdate);
      }
      onClose();
    } catch (err) {
      clearInterval(stepInterval);
      setStatus('error');
      setErrorMessage(err.message || 'Auto-synthesis failed');
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#151518] border border-[#2b2b34] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#f4f4f5]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#26262c] flex items-center justify-between bg-[#121214] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f4f4f5] tracking-tight">
                  Groq Academic Note Synthesizer
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                  LPU Llama 3.3 70B
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-0.5">
                Elevate raw intuition in <span className="text-amber-300 font-medium font-mono">"{file.title}"</span> into a formal, textbook-grade companion note.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717a] hover:text-[#f4f4f5] hover:bg-[#222227] transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0 bg-[#141417]">
          
          {/* STATE: IDLE - Choice between Review vs Auto-Save */}
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center py-8 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1b1b22] border border-[#2e2e38] flex items-center justify-center shadow-lg">
                <Sparkles className="w-8 h-8 text-amber-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#f4f4f5]">
                  How would you like to synthesize this note?
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  Your raw student notes remain 100% untouched. Groq will generate a separate, formal companion note containing formal definitions, step-by-step LaTeX derivations, and vault graph links.
                </p>
              </div>

              {existingNoteConflict && (
                <div className="w-full p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 text-left">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Companion Note Already Exists:</span>
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      "{existingNoteConflict.title}" exists in your vault. Generating a new version will archive the previous version and update the companion note without affecting your raw note.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-2">
                {/* Option A: Review & Edit Before Approving */}
                <button
                  onClick={startPreviewSynthesis}
                  className="p-4 rounded-xl bg-[#1a1a20] hover:bg-[#202028] border border-[#2c2c36] hover:border-amber-500/50 flex flex-col items-start text-left transition-all group shadow-md"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Preview & Edit Mode
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#71717a] group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-[#8e8e98] leading-normal">
                    Inspect the structured definitions, step-by-step math derivations, make manual edits, and approve before linking.
                  </p>
                  <span className="mt-3 text-[10px] font-mono text-amber-400/90 font-medium">Recommended for precision</span>
                </button>

                {/* Option B: Fast Auto-Save */}
                <button
                  onClick={() => handleQuickAutoSave(false)}
                  className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-purple-600/20 hover:from-amber-600/30 hover:via-orange-600/30 hover:to-purple-600/30 border border-amber-500/40 hover:border-amber-500/60 flex flex-col items-start text-left transition-all group shadow-md"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Quick Auto-Save
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] text-[#a1a1aa] leading-normal">
                    One-click ultra-fast synthesis. Generates formal companion file directly into the vault and connects graph links.
                  </p>
                  <span className="mt-3 text-[10px] font-mono text-emerald-400 font-medium">~1.2 seconds</span>
                </button>
              </div>

              {/* View Past Versions Button */}
              {historyList.length > 0 && (
                <button
                  onClick={() => {
                    setStatus('review');
                    setActiveTab('history');
                  }}
                  className="text-xs text-[#a1a1aa] hover:text-white flex items-center gap-1.5 transition-colors pt-2"
                >
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span>View Previous Synthesized Versions ({historyList.length})</span>
                </button>
              )}
            </div>
          )}

          {/* STATE: GENERATING (Progress View) */}
          {status === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#1b1b22] border border-amber-500/40 flex items-center justify-center animate-pulse shadow-lg shadow-amber-500/10">
                  <Zap className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 animate-ping" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#f4f4f5]">
                  Groq LPU Accelerating Note Synthesis
                </h3>
                <p className="text-xs text-amber-300/90 font-mono transition-all duration-300 min-h-[20px]">
                  {steps[progressStep]}
                </p>
              </div>

              <div className="w-full bg-[#202028] h-1.5 rounded-full overflow-hidden border border-[#2e2e38]">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${((progressStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STATE: CONFLICT WARNING (Overwrite Confirmation) */}
          {status === 'conflict' && (
            <div className="flex flex-col items-center justify-center py-10 text-center max-w-lg mx-auto space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">
                  Companion Note Exists
                </h3>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  A formal companion note named <span className="text-amber-300 font-mono font-medium">"{existingNoteConflict?.title}"</span> already exists in your vault.
                </p>
              </div>

              <div className="p-3 bg-[#191920] border border-[#2b2b35] rounded-xl text-left w-full text-xs space-y-1.5">
                <div className="flex justify-between text-[#8e8e98]">
                  <span>Target Note:</span>
                  <span className="font-mono text-white">{existingNoteConflict?.title}.md</span>
                </div>
                <div className="flex justify-between text-[#8e8e98]">
                  <span>Last Updated:</span>
                  <span className="font-mono text-white">
                    {existingNoteConflict?.updated_at ? new Date(existingNoteConflict.updated_at).toLocaleString() : 'Earlier'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full pt-2">
                <button
                  onClick={() => setStatus('idle')}
                  className="flex-1 py-2 rounded-lg bg-[#202026] hover:bg-[#282832] text-xs font-medium text-[#d4d4d8] transition-colors border border-[#2e2e38]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (previewData) {
                      handleSaveSynthesis(true);
                    } else {
                      handleQuickAutoSave(true);
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Archive & Overwrite</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE: ERROR */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-10 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <X className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-rose-300">Synthesis Encountered an Issue</h3>
                <p className="text-xs text-rose-200/80">{errorMessage}</p>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="px-4 py-2 bg-[#22222a] hover:bg-[#2a2a34] text-xs text-white rounded-lg border border-[#333340] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* STATE: REVIEW (Preview, Structured Tabs, Editable Markdown) */}
          {status === 'review' && (
            <div className="flex flex-col h-full space-y-3">
              
              {/* Toolbar: Sub-tabs and Title editor */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#26262c] shrink-0">
                <div className="flex items-center gap-1 bg-[#1a1a20] p-0.5 rounded-lg border border-[#2b2b35] text-xs">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'preview'
                        ? 'bg-[#282832] text-white shadow-sm'
                        : 'text-[#8e8e98] hover:text-[#f4f4f5]'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Editable Markdown</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('structured')}
                    className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'structured'
                        ? 'bg-[#282832] text-white shadow-sm'
                        : 'text-[#8e8e98] hover:text-[#f4f4f5]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5 text-purple-400" />
                    <span>Structured Breakdown</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                      activeTab === 'history'
                        ? 'bg-[#282832] text-white shadow-sm'
                        : 'text-[#8e8e98] hover:text-[#f4f4f5]'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Versions ({historyList.length})</span>
                  </button>
                </div>

                {/* Target Note Title */}
                {activeTab !== 'history' && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#71717a]">Title:</span>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="bg-[#1a1a20] border border-[#2e2e38] rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono max-w-xs truncate"
                      placeholder="Formal Note Title"
                    />
                  </div>
                )}
              </div>

              {/* Tab 1: Editable Markdown */}
              {activeTab === 'preview' && (
                <div className="flex-1 flex flex-col min-h-[350px] relative">
                  <div className="flex items-center justify-between text-[11px] text-[#71717a] py-1 px-1">
                    <span>Markdown Output (Directly editable before saving to vault):</span>
                    <span className="font-mono">{editableMarkdown.length} characters</span>
                  </div>
                  <textarea
                    value={editableMarkdown}
                    onChange={(e) => setEditableMarkdown(e.target.value)}
                    className="flex-1 w-full bg-[#111114] border border-[#26262c] rounded-xl p-4 text-xs font-mono text-[#e4e4e7] focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed selection:bg-amber-500/20"
                    placeholder="Rendered markdown appears here..."
                  />
                </div>
              )}

              {/* Tab 2: Structured Breakdown */}
              {activeTab === 'structured' && previewData?.structuredOutput && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[350px]">
                  {/* Intuition Bridge */}
                  {previewData.structuredOutput.intuitionBridge && (
                    <div className="p-3.5 rounded-xl bg-[#1b1b22] border border-amber-500/20 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                        <span>🧠 Preserved User Intuition</span>
                      </div>
                      <p className="text-xs text-[#d4d4d8] leading-relaxed">
                        {previewData.structuredOutput.intuitionBridge}
                      </p>
                    </div>
                  )}

                  {/* Definitions */}
                  {Array.isArray(previewData.structuredOutput.definitions) && (
                    <div className="p-3.5 rounded-xl bg-[#17171d] border border-[#272732] space-y-2">
                      <h4 className="text-xs font-semibold text-purple-300">📚 Formal Definitions & Formulas</h4>
                      <div className="space-y-2">
                        {previewData.structuredOutput.definitions.map((def, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#111114] border border-[#22222c] text-xs">
                            <span className="font-semibold text-white">{def.term}: </span>
                            <span className="text-[#a1a1aa]">{def.definition}</span>
                            {def.formula && (
                              <div className="mt-1 font-mono text-[11px] text-amber-300 bg-[#191920] px-2 py-1 rounded">
                                {def.formula}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Derivations */}
                  {Array.isArray(previewData.structuredOutput.derivations) && previewData.structuredOutput.derivations.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#17171d] border border-[#272732] space-y-2">
                      <h4 className="text-xs font-semibold text-blue-300">📐 Step-by-Step Derivations</h4>
                      {previewData.structuredOutput.derivations.map((d, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#111114] border border-[#22222c] space-y-1.5 text-xs">
                          <span className="font-semibold text-white">{d.title}</span>
                          {d.premise && <p className="text-[11px] text-[#8e8e98] italic">Premise: {d.premise}</p>}
                          {Array.isArray(d.steps) && (
                            <ol className="list-decimal pl-4 space-y-1 text-[#d4d4d8] font-mono text-[11px]">
                              {d.steps.map((st, sIdx) => (
                                <li key={sIdx}>{st}</li>
                              ))}
                            </ol>
                          )}
                          {d.conclusion && (
                            <p className="text-[11px] text-emerald-300 font-semibold mt-1">Conclusion: {d.conclusion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vault Links */}
                  {Array.isArray(previewData.structuredOutput.suggestedVaultWikilinks) && (
                    <div className="p-3.5 rounded-xl bg-[#17171d] border border-[#272732] space-y-2">
                      <h4 className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Connected Vault Wikilinks</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 text-[11px] font-mono border border-amber-500/25">
                          [[{file.title}]] (Source Raw Note)
                        </span>
                        {previewData.structuredOutput.suggestedVaultWikilinks.map((vl, idx) => (
                          <span key={idx} className="px-2 py-1 rounded bg-[#22222c] text-[#d4d4d8] text-[11px] font-mono border border-[#30303d]">
                            [[{vl.title}]]
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: History */}
              {activeTab === 'history' && (
                <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[350px]">
                  {historyList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#71717a] italic">
                      No previous synthesis versions archived for this note.
                    </div>
                  ) : (
                    historyList.map((ver) => (
                      <div
                        key={ver.id}
                        className="p-3.5 rounded-xl bg-[#17171d] border border-[#272732] flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300">v{ver.version_number}</span>
                            <span className="font-semibold text-white">{ver.formal_title || 'Formal Companion'}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#22222a] text-[#8e8e98]">
                              {ver.model}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#71717a] flex items-center gap-2">
                            <span>{new Date(ver.created_at).toLocaleString()}</span>
                            <span>•</span>
                            <span>Prompt {ver.prompt_version}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setEditableMarkdown(ver.rendered_markdown);
                            setCustomTitle(ver.formal_title || `${file.title} (Formal)`);
                            setActiveTab('preview');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#22222a] hover:bg-[#2c2c36] text-[#d4d4d8] hover:text-white text-xs border border-[#333342] transition-colors shrink-0"
                        >
                          Load into Editor
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-[#26262c] bg-[#121214] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#71717a] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Raw note <strong className="text-stone-300">"{file.title}"</strong> is immutable & preserved.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e1e24] hover:bg-[#282832] text-[#d4d4d8] hover:text-white text-xs font-medium border border-[#2e2e38] transition-colors"
            >
              Cancel
            </button>

            {status === 'review' && (
              <button
                onClick={() => handleSaveSynthesis(false)}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-950/40 border border-amber-400/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Save to Vault</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

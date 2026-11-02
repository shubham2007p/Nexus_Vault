import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeft,
  PanelRight,
  Network,
  Bot,
  FileText,
  ArrowLeft,
  Plus,
  Hash,
  Check,
} from 'lucide-react';
import MessageThread from './MessageThread';
import ChatComposer from './ChatComposer';

/**
 * Generates a rich, structured Stage 3 assistant response tailored to the user's prompt
 * so Markdown, LaTeX, code blocks, tables, and Vault wikilinks can be inspected end-to-end
 * before Stage 4 SSE streaming is attached.
 */
function buildStage3StructuredReply(userPrompt, files = []) {
  const lower = (userPrompt || '').toLowerCase();
  const existingTitles = (Array.isArray(files) ? files : []).map((f) => f.title).filter(Boolean);
  const primaryNoteTitle = existingTitles[0] || 'Operating Systems';

  if (lower.includes('backprop') || lower.includes('neural') || lower.includes('gradient')) {
    return [
      '### Matrix Chain Rule & Backpropagation Derivation',
      '',
      'In a feed-forward network with layer pre-activations $\\mathbf{z}^{(l)} = \\mathbf{W}^{(l)}\\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}$ and activation $\\mathbf{a}^{(l)} = \\sigma(\\mathbf{z}^{(l)})$, the sensitivity vector $\\boldsymbol{\\delta}^{(l)} \\equiv \\nabla_{\\mathbf{z}^{(l)}} \\mathcal{L}$ propagates backward via:',
      '',
      '$$\\boldsymbol{\\delta}^{(l)} = \\left((\\mathbf{W}^{(l+1)})^\\top \\boldsymbol{\\delta}^{(l+1)}\\right) \\odot \\sigma\'(\\mathbf{z}^{(l)})$$',
      '',
      'Once $\\boldsymbol{\\delta}^{(l)}$ is known, parameter gradients follow immediately as an outer product:',
      '',
      '$$\\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{W}^{(l)}} = \\boldsymbol{\\delta}^{(l)} (\\mathbf{a}^{(l-1)})^\\top, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{b}^{(l)}} = \\boldsymbol{\\delta}^{(l)}$$',
      '',
      '#### Reference NumPy Layer Implementation',
      '',
      '```python',
      'import numpy as np',
      '',
      'def linear_relu_backward(dout, cache):',
      '    x, w, b, z = cache',
      '    dz = dout * (z > 0)                  # ReLU derivative mask',
      '    dw = dz @ x.T / x.shape[1]           # Weight gradient',
      '    db = np.mean(dz, axis=1, keepdims=True)',
      '    dx = w.T @ dz                        # Upstream gradient',
      '    return dx, dw, db',
      '```',
      '',
      '#### Layer Complexity Summary',
      '',
      '| Operation | Forward Pass | Backward Pass | Memory Footprint |',
      '| :--- | :--- | :--- | :--- |',
      '| Dense Layer ($d_{\\text{in}} \\times d_{\\text{out}}$) | $\\mathcal{O}(B \\cdot d_{\\text{in}} d_{\\text{out}})$ | $\\mathcal{O}(B \\cdot d_{\\text{in}} d_{\\text{out}})$ | $\\mathcal{O}(B \\cdot d_{\\text{out}})$ activations |',
      '| Elementwise Activation $\\sigma(z)$ | $\\mathcal{O}(B \\cdot d_{\\text{out}})$ | $\\mathcal{O}(B \\cdot d_{\\text{out}})$ | Pre-activation cache $\\mathbf{z}^{(l)}$ |',
      '',
      `> Connected Vault Concepts: [[${primaryNoteTitle}]] and [[Neural Networks | mathematically grounds | Backpropagation]].`,
    ].join('\n');
  }

  if (lower.includes('virtual memory') || lower.includes('page table') || lower.includes('tlb')) {
    return [
      '### x86-64 Four-Level Page Table Translation',
      '',
      'A canonical 48-bit virtual address is partitioned into four 9-bit page-table indices and a 12-bit page offset ($2^{12} = 4\\text{ KB}$ page frame):',
      '',
      '$$\\text{VA}_{47:0} = \\underbrace{\\text{PML4}}_{9\\text{ bits}} \\,\\|\\, \\underbrace{\\text{PDPT}}_{9\\text{ bits}} \\,\\|\\, \\underbrace{\\text{PD}}_{9\\text{ bits}} \\,\\|\\, \\underbrace{\\text{PT}}_{9\\text{ bits}} \\,\\|\\, \\underbrace{\\text{Offset}}_{12\\text{ bits}}$$',
      '',
      'Effective memory access time ($\\text{EMAT}$) with TLB hit ratio $\\alpha$, TLB lookup time $t_{\\text{TLB}}$, and main-memory access time $t_m$ is:',
      '',
      '$$\\text{EMAT} = t_{\\text{TLB}} + \\alpha \\cdot t_m + (1 - \\alpha) \\cdot 5 t_m$$',
      '',
      '| Lookup Path | Hardware Cycles | Latency (ns) | Page Walk Reads |',
      '| :--- | :--- | :--- | :--- |',
      '| L1 dTLB Hit | 1–2 cycles | 0.5 ns | 0 memory reads |',
      '| L2 STLB Hit | 7–10 cycles | 2.8 ns | 0 memory reads |',
      '| 4-Level Page Table Walk | 120–240 cycles | 65.0 ns | 4 PTE reads + 1 data read |',
      '',
      `See linked vault notes: [[${primaryNoteTitle}]] and [[Operating Systems | translates addresses via | Virtual Memory]].`,
    ].join('\n');
  }

  return [
    `### Structured Analysis: ${userPrompt.slice(0, 72)}`,
    '',
    'Here is a structured breakdown captured for your personal knowledge vault:',
    '',
    '1. **Core Principle**: Every raw question or explanation in ChattyFi is preserved verbatim while key definitions and relationships are organized by topic.',
    '2. **Formal Representation**: When modeling state transitions or objective functions, we express invariants explicitly, such as $\\Delta \\mathcal{I}(s_t \\to s_{t+1}) \\ge 0$.',
    '',
    '```javascript',
    '// Example topic link verification in Nexus Vault',
    'export function resolveVaultConcept(topicSlug, confidence) {',
    '  if (confidence >= 0.78) return { zone: "high_confidence", action: "append_existing" };',
    '  if (confidence >= 0.45) return { zone: "ambiguous", action: "flag_review" };',
    '  return { zone: "low_confidence", action: "create_new_topic" };',
    '}',
    '```',
    '',
    `Related Vault Note: [[${primaryNoteTitle}]].`,
  ].join('\n');
}

export default function ChattyFiView({
  conversation,
  messages = [],
  files = [],
  onSendMessage,
  onStopGeneration,
  onRegenerateMessage,
  onLoadDemoConversation,
  onRenameConversation,
  onCreateConversation,
  onSwitchToNotes,
  onOpenNoteByTitle,
  onOpenNoteById,
  onOpenFullGraph,
  onOpenAIConfig,
  aiConfig,
  isGenerating = false,
  isSidebarOpen,
  onToggleSidebar,
  isRightPanelOpen,
  onToggleRightPanel,
  onReturnToLanding,
}) {
  const [composerText, setComposerText] = useState('');
  const [titleInput, setTitleInput] = useState(conversation?.title || 'New Conversation');
  const [titleSavedFlash, setTitleSavedFlash] = useState(false);
  const titleCommittedRef = useRef(conversation?.title || 'New Conversation');

  useEffect(() => {
    const nextTitle = conversation?.title || 'New Conversation';
    setTitleInput(nextTitle);
    titleCommittedRef.current = nextTitle;
  }, [conversation?.id, conversation?.title]);

  const handleTitleBlurOrEnter = async () => {
    const trimmed = (titleInput || '').trim();
    if (!conversation?.id || !trimmed || trimmed === titleCommittedRef.current) {
      setTitleInput(titleCommittedRef.current);
      return;
    }
    titleCommittedRef.current = trimmed;
    if (onRenameConversation) {
      await onRenameConversation(conversation.id, trimmed);
      setTitleSavedFlash(true);
      setTimeout(() => setTitleSavedFlash(false), 1500);
    }
  };

  const handleSend = async (content, attachments) => {
    setComposerText('');
    if (onSendMessage) {
      await onSendMessage(content, attachments);
    }
  };

  const handleSelectStarter = (promptText) => {
    setComposerText(promptText);
  };

  const topics = Array.isArray(conversation?.topics) ? conversation.topics : [];
  const activeProvider = aiConfig?.activeProvider || 'groq';
  const hasActiveKey = Boolean(
    aiConfig?.keys?.[activeProvider] && aiConfig?.keys?.[activeProvider].trim() !== ''
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF8F5] dark:bg-[#15161A] overflow-hidden select-text">
      {/* Top Action Bar (Matches Editor.jsx h-12 layout & controls) */}
      <div className="h-12 border-b border-[#E3E5DF] dark:border-[#272A32] bg-[#F7F7F4] dark:bg-[#18191E] px-4 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left: Sidebar Toggle, Conversation Title & Topic Badges */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-[#4A4F49] dark:text-[#A1A1AA] hover:text-[#242824] dark:hover:text-[#F4F4F5] hover:bg-[#E8EAE4] dark:hover:bg-[#202227] transition-colors cursor-pointer shrink-0"
              title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {!isSidebarOpen && onReturnToLanding && (
            <button
              onClick={onReturnToLanding}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#666B65] dark:text-[#A1A1AA] hover:text-[#287D54] dark:hover:text-emerald-400 border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 group"
              title="Return to Website Overview"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span className="hidden sm:inline font-medium">Website Overview</span>
            </button>
          )}

          {conversation ? (
            <input
              type="text"
              size={1}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Conversation title..."
              className="bg-transparent text-sm md:text-base font-semibold text-[#242824] dark:text-[#F4F4F5] focus:outline-none min-w-[80px] flex-1 max-w-xs md:max-w-md truncate placeholder-[#878C85] dark:placeholder-[#71717A]"
              title="Click to rename conversation"
            />
          ) : (
            <span className="text-sm md:text-base font-semibold text-[#242824] dark:text-[#F4F4F5] truncate min-w-0 flex-1">
              ChattyFi Knowledge Session
            </span>
          )}

          {titleSavedFlash && (
            <span className="inline-flex items-center gap-1 text-xs text-[#287D54] dark:text-emerald-400 font-medium shrink-0">
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Saved</span>
            </span>
          )}

          {/* Topic Confidence Pills (Safeguard 4: 3-zone topic confidence) */}
          {topics.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 border-l border-[#E3E5DF] dark:border-[#272A32] pl-2.5 overflow-hidden">
              {topics.slice(0, 2).map((t) => {
                const zone = t.match_zone || t.confidence_zone || 'high_confidence';
                const isAmbiguous = zone === 'ambiguous';
                return (
                  <span
                    key={t.id || t.normalized_name || t.name}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono truncate ${
                      isAmbiguous
                        ? 'bg-[#FEF7EC] dark:bg-amber-950/40 text-[#9A6214] dark:text-amber-300 border border-[#E7A23B]/35'
                        : 'bg-[#EBF5F0] dark:bg-emerald-950/40 text-[#1F6342] dark:text-emerald-300 border border-[#287D54]/25'
                    }`}
                    title={`Topic: ${t.name} (${zone})`}
                  >
                    <Hash className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{t.name}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Workspace & AI Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* New Conversation Quick Button */}
          {onCreateConversation && (
            <button
              onClick={() => onCreateConversation()}
              className="hidden sm:flex h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium items-center gap-1 cursor-pointer transition-colors"
              title="Start a new conversation"
            >
              <Plus className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden md:inline">New Chat</span>
            </button>
          )}

          {/* Switch to Notes Editor Button */}
          {onSwitchToNotes && (
            <button
              onClick={onSwitchToNotes}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Switch center pane to Markdown Notes Editor"
            >
              <FileText className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden sm:inline">Notes Editor</span>
            </button>
          )}

          {/* AI Model Config Button */}
          {onOpenAIConfig && (
            <button
              onClick={onOpenAIConfig}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E22] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Configure AI Models & API Keys"
            >
              <Bot className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden md:inline font-medium">AI Model</span>
              {hasActiveKey && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  title="Active API key configured"
                />
              )}
            </button>
          )}

          {/* Fullscreen Graph Button */}
          {onOpenFullGraph && (
            <button
              onClick={onOpenFullGraph}
              className="h-7 px-2.5 rounded-md bg-white dark:bg-[#1E1E24] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#D4D4D8] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Expand to Fullscreen Graph"
            >
              <Network className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
              <span className="hidden sm:inline">Graph</span>
            </button>
          )}

          {/* Right Inspector Toggle */}
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

      {/* Scrollable Message Thread */}
      <MessageThread
        messages={messages}
        files={files}
        isGenerating={isGenerating}
        onSelectStarterPrompt={handleSelectStarter}
        onLoadDemoConversation={onLoadDemoConversation}
        onRegenerateMessage={onRegenerateMessage}
        onOpenNoteByTitle={onOpenNoteByTitle}
        onOpenNoteById={onOpenNoteById}
      />

      {/* Centered Bottom Composer */}
      <ChatComposer
        value={composerText}
        onChange={setComposerText}
        onSendMessage={handleSend}
        isGenerating={isGenerating}
        onStopGeneration={onStopGeneration}
        aiConfig={aiConfig}
        onOpenAIConfig={onOpenAIConfig}
      />
    </div>
  );
}

export { buildStage3StructuredReply };


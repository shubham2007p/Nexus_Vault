import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Key,
  Cpu,
  Check,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Zap,
  Server,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const PROVIDER_METADATA = {
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra-Fast LPU',
    color: '#F55036',
    bgColor: 'rgba(245, 80, 54, 0.1)',
    borderColor: 'rgba(245, 80, 54, 0.3)',
    defaultModel: 'openai/gpt-oss-120b',
    models: [
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    keyPrefix: 'gsk_',
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    description: 'Ultra-low latency LPU engine for instant academic synthesis and link mapping.',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Nuanced Reasoning',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude 3.5 Sonnet excels at scholarly prose and nuanced semantic graph structures.',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    badge: 'Industry Standard',
    color: '#10A37F',
    bgColor: 'rgba(16, 163, 127, 0.1)',
    borderColor: 'rgba(16, 163, 127, 0.3)',
    defaultModel: 'gpt-4o-mini',
    models: [
      'gpt-4o-mini',
      'gpt-4o',
      'o3-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-proj-... or sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'Gold-standard GPT-4o models for comprehensive markdown formulations and derivations.',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Deep Context',
    color: '#4285F4',
    bgColor: 'rgba(66, 133, 244, 0.1)',
    borderColor: 'rgba(66, 133, 244, 0.3)',
    defaultModel: 'gemini-1.5-flash',
    models: [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
    ],
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description: 'High-speed 1M+ token context windows for cross-vault synthesis.',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Universal Router',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    models: [
      'meta-llama/llama-3.3-70b-instruct',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o-mini',
      'deepseek/deepseek-chat',
      'google/gemini-flash-1.5',
    ],
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
    description: 'Access hundreds of frontier and open-source models with a single unified API key.',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    badge: 'European Frontier',
    color: '#EA580C',
    bgColor: 'rgba(234, 88, 12, 0.1)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    defaultModel: 'mistral-small-latest',
    models: [
      'mistral-small-latest',
      'mistral-large-latest',
      'codestral-latest',
    ],
    keyPrefix: '',
    keyPlaceholder: 'mistral_api_key...',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    description: 'European open-weight models optimized for concise logic and mathematical derivation.',
  },
  custom: {
    id: 'custom',
    name: 'Custom / Local',
    badge: 'Ollama & LM Studio',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.3)',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5', 'mistral', 'deepseek-r1', 'custom'],
    keyPrefix: '',
    keyPlaceholder: 'Optional local key (e.g. ollama or sk-...)',
    docsUrl: 'https://ollama.com/',
    description: 'Run completely private models locally on your hardware without internet access.',
  },
};

export default function AIConfigModal({
  isOpen,
  onClose,
  aiConfig,
  onSaveConfig,
  theme,
}) {
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [keys, setKeys] = useState({});
  const [models, setModels] = useState({});
  const [baseUrls, setBaseUrls] = useState({});
  const [customModelInputs, setCustomModelInputs] = useState({});
  const [useCustomModel, setUseCustomModel] = useState({});
  const [showKey, setShowKey] = useState(false);
  const [detectedBadge, setDetectedBadge] = useState(null);

  // Testing status
  const [testStatus, setTestStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'error'
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when modal opens or aiConfig changes
  useEffect(() => {
    if (aiConfig) {
      setSelectedProvider(aiConfig.activeProvider || 'groq');
      setKeys(aiConfig.keys || {});
      setModels(aiConfig.models || {});
      setBaseUrls(aiConfig.baseUrls || {});
    }
  }, [aiConfig, isOpen]);

  // Handle escape key
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentMeta = PROVIDER_METADATA[selectedProvider] || PROVIDER_METADATA.groq;
  const currentKey = keys[selectedProvider] || '';
  const currentModel = models[selectedProvider] || currentMeta.defaultModel;
  const currentBaseUrl = baseUrls[selectedProvider] || currentMeta.endpoint || '';

  // Smart detection on key input
  const handleKeyChange = (e) => {
    const val = e.target.value;
    setKeys((prev) => ({ ...prev, [selectedProvider]: val }));
    setTestStatus('idle');
    setTestResult(null);

    // Auto-detect provider if user pastes a key that belongs to another provider
    const trimmed = val.trim();
    let detected = null;
    if (trimmed.startsWith('gsk_')) detected = 'groq';
    else if (trimmed.startsWith('sk-ant-')) detected = 'anthropic';
    else if (trimmed.startsWith('sk-or-')) detected = 'openrouter';
    else if (trimmed.startsWith('AIza')) detected = 'gemini';
    else if (trimmed.startsWith('sk-') && !trimmed.startsWith('sk-or-') && !trimmed.startsWith('sk-ant-')) detected = 'openai';

    if (detected && detected !== selectedProvider) {
      setDetectedBadge(`Auto-detected ${PROVIDER_METADATA[detected].name} API key! Switching provider.`);
      setTimeout(() => {
        setSelectedProvider(detected);
        setKeys((prev) => ({ ...prev, [detected]: val }));
        if (!models[detected]) {
          setModels((prev) => ({ ...prev, [detected]: PROVIDER_METADATA[detected].defaultModel }));
        }
        setDetectedBadge(null);
      }, 700);
    } else {
      setDetectedBadge(null);
    }
  };

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setTestStatus('idle');
    setTestResult(null);
    setDetectedBadge(null);

    // Default model if unset
    if (!models[providerId]) {
      const meta = PROVIDER_METADATA[providerId];
      setModels((prev) => ({ ...prev, [providerId]: meta.defaultModel }));
    }
  };

  const handleModelSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setUseCustomModel((prev) => ({ ...prev, [selectedProvider]: true }));
    } else {
      setUseCustomModel((prev) => ({ ...prev, [selectedProvider]: false }));
      setModels((prev) => ({ ...prev, [selectedProvider]: val }));
    }
    setTestStatus('idle');
    setTestResult(null);
  };

  const handleCustomModelChange = (e) => {
    const val = e.target.value;
    setCustomModelInputs((prev) => ({ ...prev, [selectedProvider]: val }));
    setModels((prev) => ({ ...prev, [selectedProvider]: val }));
    setTestStatus('idle');
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestResult(null);

    try {
      const targetModel = models[selectedProvider] || currentMeta.defaultModel;
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: currentKey,
          model: targetModel,
          baseUrl: currentBaseUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setTestStatus('error');
        setTestResult(data.error || 'Connection failed');
      } else {
        setTestStatus('success');
        setTestResult(data.message || `Connected in ${data.latencyMs}ms!`);
      }
    } catch (err) {
      setTestStatus('error');
      setTestResult(err.message || 'Network error while testing connection');
    }
  };

  const handleSaveAndActivate = async () => {
    setIsSaving(true);
    const targetModel = models[selectedProvider] || currentMeta.defaultModel;

    const updatedConfig = {
      activeProvider: selectedProvider,
      activeModel: targetModel,
      keys: { ...keys },
      models: { ...models, [selectedProvider]: targetModel },
      baseUrls: { ...baseUrls },
    };

    try {
      // 1. Save to backend database
      await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProvider: selectedProvider,
          keys,
          models: updatedConfig.models,
          baseUrls,
        }),
      });

      // 2. Call parent callback which updates localStorage and global React state
      if (onSaveConfig) {
        onSaveConfig(updatedConfig);
      }

      setIsSaving(false);
      onClose();
    } catch (err) {
      console.error('Failed to save AI config to server:', err);
      // Still update parent in frontend
      if (onSaveConfig) {
        onSaveConfig(updatedConfig);
      }
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#151518] border border-[#E3E5DF] dark:border-[#272A32] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E3E5DF] dark:border-[#26262c] flex items-center justify-between bg-[#F7F7F4] dark:bg-[#111113] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#287D54] dark:text-emerald-400 shadow-2xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#242824] dark:text-[#f4f4f5]">
                  AI Model & API Key Configuration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#287D54] dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  Universal Hub
                </span>
              </div>
              <p className="text-xs text-[#666B65] dark:text-[#8e8e98] mt-0.5">
                Configure your API key to run note synthesis and intelligent link discoveries.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666B65] hover:text-[#242824] dark:text-[#8e8e98] dark:hover:text-[#f4f4f5] hover:bg-[#EAECE6] dark:hover:bg-[#202227] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0 text-[#242824] dark:text-[#E4E4E7]">
          {/* Provider Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#4A4F49] dark:text-[#A1A1AA] uppercase tracking-wider">
                Select AI Provider
              </label>
              <span className="text-[11px] text-[#878C85] dark:text-[#71717A]">
                Active: <strong className="text-[#242824] dark:text-[#f4f4f5]">{currentMeta.name}</strong>
              </span>
            </div>

            {/* Top 3 Core Examples + Extended Providers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(PROVIDER_METADATA).map((p) => {
                const isSelected = selectedProvider === p.id;
                const hasKeyConfigured = Boolean(keys[p.id] && keys[p.id].trim() !== '');

                return (
                  <button
                    key={p.id}
                    onClick={() => handleProviderSelect(p.id)}
                    className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      isSelected
                        ? 'bg-white dark:bg-[#1E1E24] shadow-md border-[#287D54] dark:border-emerald-500 ring-1 ring-[#287D54] dark:ring-emerald-500/50'
                        : 'bg-[#F7F7F4]/60 dark:bg-[#18181C] border-[#E3E5DF] dark:border-[#272A32] hover:bg-white dark:hover:bg-[#1E1E22] hover:border-[#D1D5CB] dark:hover:border-[#383C46]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs text-[#242824] dark:text-[#f4f4f5] truncate">
                        {p.name}
                      </span>
                      {hasKeyConfigured && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="API Key Set" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#666B65] dark:text-[#8e8e98] leading-tight truncate">
                      {p.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-detected notification banner */}
          {detectedBadge && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-[#287D54] dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{detectedBadge}</span>
            </div>
          )}

          {/* Active Provider Card & Key Configuration */}
          <div className="p-4 rounded-xl border border-[#E3E5DF] dark:border-[#272A32] bg-[#FAFAF8] dark:bg-[#1A1A1E] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#242824] dark:text-[#f4f4f5]">
                    {currentMeta.name} Setup
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border"
                    style={{
                      color: currentMeta.color,
                      backgroundColor: currentMeta.bgColor,
                      borderColor: currentMeta.borderColor,
                    }}
                  >
                    {currentMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-[#666B65] dark:text-[#8e8e98] mt-1 leading-relaxed">
                  {currentMeta.description}
                </p>
              </div>

              {currentMeta.docsUrl && (
                <a
                  href={currentMeta.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#287D54] dark:text-emerald-400 hover:underline shrink-0"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#4A4F49] dark:text-[#A1A1AA] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
                  API Key
                </label>
                {currentKey && (
                  <span className="text-[10px] text-[#878C85] dark:text-[#71717A] font-mono">
                    {currentKey.length} chars
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={currentKey}
                  onChange={handleKeyChange}
                  placeholder={currentMeta.keyPlaceholder}
                  className="w-full h-9 pl-3 pr-20 text-xs font-mono rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#121214] text-[#242824] dark:text-[#f4f4f5] focus:outline-none focus:ring-1 focus:ring-[#287D54] dark:focus:ring-emerald-500 placeholder-[#878C85] dark:placeholder-[#71717A]"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 rounded text-[#666B65] hover:text-[#242824] dark:text-[#8e8e98] dark:hover:text-[#f4f4f5] transition-colors cursor-pointer"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {currentKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setKeys((prev) => ({ ...prev, [selectedProvider]: '' }));
                        setTestStatus('idle');
                        setTestResult(null);
                      }}
                      className="p-1 rounded text-[#878C85] hover:text-red-500 transition-colors cursor-pointer"
                      title="Clear key"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-medium text-[#4A4F49] dark:text-[#A1A1AA] flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
                  Model (Default Selected)
                </label>
                <select
                  value={useCustomModel[selectedProvider] ? '__custom__' : currentModel}
                  onChange={handleModelSelect}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#121214] text-[#242824] dark:text-[#f4f4f5] focus:outline-none focus:ring-1 focus:ring-[#287D54] dark:focus:ring-emerald-500 cursor-pointer"
                >
                  {currentMeta.models.map((m) => (
                    <option key={m} value={m}>
                      {m} {m === currentMeta.defaultModel ? '(Default Recommended)' : ''}
                    </option>
                  ))}
                  <option value="__custom__">⚙️ Custom Model Name...</option>
                </select>
              </div>

              {/* Custom Model input if chosen */}
              {useCustomModel[selectedProvider] ? (
                <div>
                  <label className="text-xs font-medium text-[#4A4F49] dark:text-[#A1A1AA] flex items-center gap-1.5 mb-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    Custom Model ID
                  </label>
                  <input
                    type="text"
                    value={customModelInputs[selectedProvider] || currentModel}
                    onChange={handleCustomModelChange}
                    placeholder="e.g. meta-llama/llama-3-8b"
                    className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#121214] text-[#242824] dark:text-[#f4f4f5] focus:outline-none focus:ring-1 focus:ring-[#287D54] dark:focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-[#4A4F49] dark:text-[#A1A1AA] flex items-center gap-1.5 mb-1.5">
                    <Server className="w-3.5 h-3.5 text-[#878C85]" />
                    API Endpoint
                  </label>
                  <input
                    type="text"
                    disabled={selectedProvider !== 'custom'}
                    value={currentBaseUrl}
                    onChange={(e) =>
                      setBaseUrls((prev) => ({ ...prev, [selectedProvider]: e.target.value }))
                    }
                    placeholder="Endpoint URL"
                    className="w-full h-9 px-3 text-xs font-mono rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-[#F0F1ED]/50 dark:bg-[#17171A] text-[#666B65] dark:text-[#8e8e98] disabled:opacity-75 focus:outline-none focus:ring-1 focus:ring-[#287D54]"
                  />
                </div>
              )}
            </div>

            {/* Test Connection Button & Result Feedback */}
            <div className="pt-2 border-t border-[#E3E5DF] dark:border-[#26262c] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing' || (!currentKey && selectedProvider !== 'custom')}
                className="h-8 px-3 rounded-lg bg-white dark:bg-[#1E1E24] hover:bg-[#F0F1ED] dark:hover:bg-[#27272E] text-[#242824] dark:text-[#E4E4E7] border border-[#E3E5DF] dark:border-[#272A32] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
              >
                {testStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#287D54] dark:text-emerald-400" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#287D54] dark:text-emerald-400" />
                    <span>Test Key & Model</span>
                  </>
                )}
              </button>

              {/* Status Message */}
              {testStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-xs text-[#287D54] dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}

              {testStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 max-w-sm truncate" title={testResult}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="truncate">{testResult}</span>
                </div>
              )}
            </div>
          </div>

          {/* Universal Integration Note */}
          <div className="p-3.5 rounded-xl bg-[#F0F1ED]/60 dark:bg-[#18181B] border border-[#E3E5DF] dark:border-[#272A32] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#287D54] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-[#666B65] dark:text-[#8e8e98] leading-relaxed">
              <p>
                <strong>Privacy & Security:</strong> Your API keys are stored locally in your browser and used only to make direct, authenticated requests to your selected AI model provider.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E3E5DF] dark:border-[#26262c] flex items-center justify-between bg-[#F7F7F4] dark:bg-[#111113] shrink-0">
          <div className="text-xs text-[#878C85] dark:text-[#71717A]">
            Active provider: <span className="font-semibold text-[#242824] dark:text-[#f4f4f5]">{currentMeta.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-lg text-xs font-medium text-[#666B65] dark:text-[#8e8e98] hover:text-[#242824] dark:hover:text-[#f4f4f5] hover:bg-[#EAECE6] dark:hover:bg-[#202227] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAndActivate}
              disabled={isSaving}
              className="h-8 px-4 rounded-lg bg-[#287D54] hover:bg-[#206644] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Set Active</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

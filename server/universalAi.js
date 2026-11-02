import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { dbAll, dbRun, dbGet } from './db.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export function getFreshDiskEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      return dotenv.parse(fs.readFileSync(envPath, 'utf8'));
    }
  } catch (e) {}
  return {};
}

export const CURRENT_PROMPT_VERSION = 'v2.0.0-universal-ai';

/**
 * Supported AI Providers catalog with default models, key prefixes, and metadata.
 */
export const AI_PROVIDERS = {
  groq: {
    id: 'groq',
    name: 'Groq Cloud (LPU)',
    description: 'Ultra-fast inference powered by Groq LPUs',
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
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    docsUrl: 'https://console.groq.com/keys',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Industry-leading reasoning and nuanced contextual analysis',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    keyPrefix: 'sk-ant-',
    keyPlaceholder: 'sk-ant-...',
    endpoint: 'https://api.anthropic.com/v1/messages',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'Gold-standard GPT-4o models for general synthesis & links',
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
    endpoint: 'https://api.openai.com/v1/chat/completions',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Massive context windows and rapid multimodal intelligence',
    defaultModel: 'gemini-1.5-flash',
    models: [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
    ],
    keyPrefix: 'AIza',
    keyPlaceholder: 'AIzaSy...',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified router supporting hundreds of open and proprietary models',
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
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    docsUrl: 'https://openrouter.ai/keys',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Frontier European models renowned for efficiency and logic',
    defaultModel: 'mistral-small-latest',
    models: [
      'mistral-small-latest',
      'mistral-large-latest',
      'codestral-latest',
    ],
    keyPrefix: '',
    keyPlaceholder: 'mistral_api_key...',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    docsUrl: 'https://console.mistral.ai/api-keys/',
  },
  custom: {
    id: 'custom',
    name: 'Custom / Local (Ollama, LM Studio)',
    description: 'Local or custom OpenAI-compatible server without internet access',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5', 'mistral', 'deepseek-r1', 'custom'],
    keyPrefix: '',
    keyPlaceholder: 'Optional key (e.g. ollama or sk-...)',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    docsUrl: 'https://ollama.com/',
  },
};

/**
 * Auto-detect provider from API key format
 */
export function detectProviderFromKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.startsWith('gsk_')) return 'groq';
  if (trimmed.startsWith('sk-ant-')) return 'anthropic';
  if (trimmed.startsWith('sk-or-')) return 'openrouter';
  if (trimmed.startsWith('AIza')) return 'gemini';
  if (trimmed.startsWith('sk-')) return 'openai';
  return null;
}

/**
 * Resilient JSON extractor from LLM text responses
 */
export function parseJSONFromLLM(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('LLM response text is empty');
  }

  // 1. Direct parse attempt
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Continue to fence/regex extraction
  }

  // 2. Extract from markdown code fences: ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      // Continue
    }
  }

  // 3. Find outermost matching brackets { ... } or [ ... ]
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Continue
    }
  }

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // Continue
    }
  }

  throw new Error(`Unable to extract valid JSON from LLM response. Content snippet: ${text.substring(0, 200)}...`);
}

/**
 * Resolves active AI configuration by checking:
 * 1. Request headers (client-specified)
 * 2. SQLite app_settings table
 * 3. Environment variables (.env)
 */
export async function resolveAIConfig(req = null) {
  let provider = req?.headers?.['x-ai-provider'] || null;
  let apiKey = req?.headers?.['x-ai-key'] || null;
  let model = req?.headers?.['x-ai-model'] || null;
  let baseUrl = req?.headers?.['x-ai-base-url'] || null;

  // If missing from request headers, check database app_settings
  if (!apiKey || !provider) {
    try {
      const dbRows = await dbAll(`SELECT key, value FROM app_settings WHERE key LIKE 'ai_%'`);
      const dbSettings = {};
      for (const row of dbRows) {
        dbSettings[row.key] = row.value;
      }

      if (!provider && dbSettings['ai_active_provider']) {
        provider = dbSettings['ai_active_provider'];
      }

      if (provider) {
        if (!apiKey && dbSettings[`ai_key_${provider}`]) {
          apiKey = dbSettings[`ai_key_${provider}`];
        }
        if (!model && dbSettings[`ai_model_${provider}`]) {
          model = dbSettings[`ai_model_${provider}`];
        }
        if (!baseUrl && dbSettings[`ai_base_url_${provider}`]) {
          baseUrl = dbSettings[`ai_base_url_${provider}`];
        }
      }
    } catch (err) {
      console.warn('Could not read AI settings from DB:', err.message);
    }
  }

  // Fallback to fresh disk environment variables (.env) if still unconfigured
  const diskEnv = getFreshDiskEnv();
  const diskKeyMap = {
    groq: diskEnv.GROQ_API_KEY,
    openai: diskEnv.OPENAI_API_KEY,
    anthropic: diskEnv.ANTHROPIC_API_KEY,
    gemini: diskEnv.GEMINI_API_KEY,
    openrouter: diskEnv.OPENROUTER_API_KEY,
    mistral: diskEnv.MISTRAL_API_KEY,
  };

  if (!apiKey || !provider) {
    if (diskKeyMap.groq && diskKeyMap.groq.trim() !== '' && !diskKeyMap.groq.startsWith('your_')) {
      provider = provider || 'groq';
      apiKey = apiKey || diskKeyMap.groq.trim();
      model = model || diskEnv.GROQ_MODEL || AI_PROVIDERS.groq.defaultModel;
    } else if (diskKeyMap.openai && diskKeyMap.openai.trim() !== '' && !diskKeyMap.openai.startsWith('your_')) {
      provider = provider || 'openai';
      apiKey = apiKey || diskKeyMap.openai.trim();
      model = model || diskEnv.OPENAI_MODEL || AI_PROVIDERS.openai.defaultModel;
    } else if (diskKeyMap.anthropic && diskKeyMap.anthropic.trim() !== '' && !diskKeyMap.anthropic.startsWith('your_')) {
      provider = provider || 'anthropic';
      apiKey = apiKey || diskKeyMap.anthropic.trim();
      model = model || diskEnv.ANTHROPIC_MODEL || AI_PROVIDERS.anthropic.defaultModel;
    } else if (diskKeyMap.gemini && diskKeyMap.gemini.trim() !== '' && !diskKeyMap.gemini.startsWith('your_')) {
      provider = provider || 'gemini';
      apiKey = apiKey || diskKeyMap.gemini.trim();
      model = model || diskEnv.GEMINI_MODEL || AI_PROVIDERS.gemini.defaultModel;
    }
  }

  // If apiKey is still unconfigured, check if provider has a disk env key
  if (!apiKey && provider && diskKeyMap[provider]) {
    const k = diskKeyMap[provider].trim();
    if (k && !k.startsWith('your_')) {
      apiKey = k;
    }
  }

  // Normalize defaults
  provider = provider || 'groq';
  const meta = AI_PROVIDERS[provider] || AI_PROVIDERS.groq;
  model = model || meta.defaultModel;

  return {
    provider,
    apiKey: apiKey || '',
    model,
    baseUrl: baseUrl || meta.endpoint,
  };
}

/**
 * Universal LLM dispatch call
 */
export async function callUniversalLLM({
  provider = 'groq',
  apiKey = '',
  model = '',
  baseUrl = '',
  systemPrompt = '',
  userPrompt = '',
  jsonMode = false,
  temperature = 0.3,
  maxTokens = 4096,
  timeoutMs = 45000,
}) {
  const normProvider = provider.toLowerCase();
  const providerMeta = AI_PROVIDERS[normProvider] || AI_PROVIDERS.groq;
  const activeModel = model || providerMeta.defaultModel;

  if (normProvider !== 'custom' && (!apiKey || apiKey.trim() === '' || apiKey.startsWith('your_'))) {
    throw new Error(
      `No API key configured for ${providerMeta.name}. Please click the AI / Robot button in the top bar to set your API key.`
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // -------------------------------------------------------------
    // Provider: Anthropic (Claude Messages API)
    // -------------------------------------------------------------
    if (normProvider === 'anthropic') {
      try {
        const anthropic = new Anthropic({ apiKey });
        const resp = await anthropic.messages.create({
          model: activeModel,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }, { signal: controller.signal });

        clearTimeout(timer);
        const text = resp.content
          ?.filter((b) => b.type === 'text')
          ?.map((b) => b.text)
          ?.join('\n') || '';

        return {
          content: text,
          model: activeModel,
          provider: normProvider,
        };
      } catch (anthropicErr) {
        clearTimeout(timer);
        throw anthropicErr;
      }
    }

    // -------------------------------------------------------------
    // Provider: Groq (via Groq SDK or OpenAI-compatible endpoint)
    // -------------------------------------------------------------
    if (normProvider === 'groq') {
      try {
        const groq = new Groq({ apiKey });
        const requestPayload = {
          model: activeModel,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        };

        if (jsonMode) {
          requestPayload.response_format = { type: 'json_object' };
        }

        const resp = await groq.chat.completions.create(requestPayload, {
          signal: controller.signal,
        });

        clearTimeout(timer);
        const text = resp.choices?.[0]?.message?.content || '';
        return {
          content: text,
          model: activeModel,
          provider: normProvider,
        };
      } catch (groqErr) {
        clearTimeout(timer);
        throw groqErr;
      }
    }

    // -------------------------------------------------------------
    // OpenAI, Google Gemini, OpenRouter, Mistral, and Custom Ollama
    // All follow the standard OpenAI /chat/completions specification!
    // -------------------------------------------------------------
    let targetEndpoint = baseUrl || providerMeta.endpoint;
    if (normProvider === 'custom' && !targetEndpoint.endsWith('/chat/completions')) {
      targetEndpoint = targetEndpoint.replace(/\/+$/, '') + '/chat/completions';
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (apiKey && apiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    if (normProvider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://nexus-vault.local';
      headers['X-Title'] = 'Nexus Vault';
    }

    const messages = [];
    if (systemPrompt && systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    const requestBody = {
      model: activeModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson.error?.message || errJson.message || JSON.stringify(errJson);
      } catch (e) {
        errText = await response.text();
      }
      throw new Error(
        `${providerMeta.name} API error (${response.status}): ${errText || response.statusText}`
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      content: text,
      model: activeModel,
      provider: normProvider,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`${providerMeta.name} request timed out after ${timeoutMs / 1000} seconds.`);
    }
    throw err;
  }
}

/**
 * Live test of API credentials and model availability
 */
export async function testAIConnection({ provider, apiKey, model, baseUrl }) {
  const startTime = Date.now();
  const meta = AI_PROVIDERS[provider] || AI_PROVIDERS.groq;
  const targetModel = model || meta.defaultModel;

  const testSystemPrompt = 'You are an API health verification assistant.';
  const testUserPrompt = 'Respond with the single word "CONNECTED".';

  const result = await callUniversalLLM({
    provider,
    apiKey,
    model: targetModel,
    baseUrl,
    systemPrompt: testSystemPrompt,
    userPrompt: testUserPrompt,
    jsonMode: false,
    maxTokens: 50,
    timeoutMs: 15000,
  });

  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    provider,
    model: targetModel,
    latencyMs,
    message: `Connected successfully to ${meta.name} (${targetModel}) in ${latencyMs}ms!`,
  };
}

/**
 * Fallback heuristic link generator when API is unconfigured
 */
function generateHeuristicProposals(currentFile, availableTitles) {
  const contentLower = currentFile.content.toLowerCase();
  const titleLower = currentFile.title.toLowerCase();
  const proposals = [];

  for (const target of availableTitles) {
    if (proposals.length >= 5) break;
    const targetLower = target.toLowerCase();
    if (targetLower === titleLower) continue;

    const appearsInContent = contentLower.includes(targetLower);
    const targetWords = targetLower.split(/\s+/).filter((w) => w.length > 3);
    const wordMatches = targetWords.filter((w) => contentLower.includes(w));

    if (appearsInContent) {
      proposals.push({
        target_title: target,
        relationship: 'relies_on',
        context: `Direct mention of "${target}" detected inside note text`,
        reasoning: 'Lexical co-occurrence in document content',
      });
    } else if (wordMatches.length >= 2 || (targetWords.length === 1 && wordMatches.length === 1)) {
      proposals.push({
        target_title: target,
        relationship: 'complements',
        context: `Contextual overlap observed regarding "${wordMatches.join(', ')}"`,
        reasoning: 'Keyword overlap and semantic proximity',
      });
    }
  }

  return proposals;
}

/**
 * Universal Link Proposal & AI Processing
 */
export async function processFileWithUniversalAI(fileId, aiConfig) {
  const currentFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
  if (!currentFile) {
    throw new Error('File not found');
  }

  const allOtherFiles = await dbAll(`SELECT id, title FROM files WHERE id != ?`, [fileId]);
  const titlesList = allOtherFiles.map((f) => f.title);
  const titleToIdMap = new Map(allOtherFiles.map((f) => [f.title.toLowerCase(), f.id]));

  const existingLinks = await dbAll(
    `SELECT target_title FROM links WHERE source_file_id = ?`,
    [fileId]
  );
  const existingTargetTitles = new Set(existingLinks.map((l) => l.target_title.toLowerCase()));
  const availableTitles = titlesList.filter((t) => !existingTargetTitles.has(t.toLowerCase()));

  let proposals = [];
  let rawResponseLog = '';
  const now = new Date().toISOString();

  const provider = aiConfig?.provider || 'groq';
  const apiKey = aiConfig?.apiKey || '';

  if (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('your_')) {
    try {
      const systemPrompt = `You are an AI note curator analyzing an Obsidian-style knowledge vault.
Your goal is to identify semantic links and conceptual relationships between notes.
You MUST output your response strictly as a JSON object with a "proposals" array formatted as:
{
  "proposals": [
    {
      "target_title": "Exact note title from Available Target Note Titles",
      "relationship": "prerequisite_for | relies_on | generalizes | implements | complements",
      "context": "Brief explanation of why these notes are connected.",
      "reasoning": "Reasoning behind proposing this connection."
    }
  ]
}
Return ONLY valid JSON. Propose between 1 and 5 contextual links.`;

      const userPrompt = `Current Note Title: "${currentFile.title}"
Current Note Content:
"""
${currentFile.content}
"""

Available Target Note Titles in Vault:
${JSON.stringify(availableTitles.slice(0, 60), null, 2)}

Existing Links from this Note:
${JSON.stringify(Array.from(existingTargetTitles), null, 2)}

Propose high-value contextual connections now.`;

      const result = await callUniversalLLM({
        provider,
        apiKey,
        model: aiConfig?.model,
        baseUrl: aiConfig?.baseUrl,
        systemPrompt,
        userPrompt,
        jsonMode: true,
        temperature: 0.2,
      });

      rawResponseLog = result.content;
      const parsed = parseJSONFromLLM(result.content);
      const list = Array.isArray(parsed) ? parsed : parsed.proposals || [];

      // Validate titles against available titles
      const availableLowerMap = new Map(availableTitles.map((t) => [t.toLowerCase(), t]));
      for (const item of list) {
        if (item.target_title && availableLowerMap.has(item.target_title.toLowerCase())) {
          proposals.push({
            target_title: availableLowerMap.get(item.target_title.toLowerCase()),
            relationship: item.relationship || 'complements',
            context: item.context || 'Contextual correlation identified by AI',
            reasoning: item.reasoning || '',
          });
        }
      }

      if (proposals.length === 0) {
        // Fallback heuristic if LLM proposed no valid existing titles
        proposals = generateHeuristicProposals(currentFile, availableTitles);
      }
    } catch (err) {
      console.warn(`Universal AI (${provider}) link discovery failed:`, err.message);
      proposals = generateHeuristicProposals(currentFile, availableTitles);
      rawResponseLog = `Heuristic fallback triggered (${provider}): ${err.message}`;
    }
  } else {
    proposals = generateHeuristicProposals(currentFile, availableTitles);
    rawResponseLog = `Fallback heuristic engine used (no API key for ${provider}). Propose count: ${proposals.length}`;
  }

  // Insert suggested links into DB
  const createdSuggestions = [];
  for (const prop of proposals) {
    const targetTitle = prop.target_title;
    const targetFileId = titleToIdMap.get(targetTitle.toLowerCase()) || null;

    const existingSuggestion = await dbGet(
      `SELECT id FROM links WHERE source_file_id = ? AND LOWER(target_title) = ? AND status = 'pending'`,
      [fileId, targetTitle.toLowerCase()]
    );

    if (!existingSuggestion) {
      const res = await dbRun(
        `INSERT INTO links (source_file_id, target_file_id, target_title, relationship, context, is_ai_suggested, status, created_at)
         VALUES (?, ?, ?, ?, ?, 1, 'pending', ?)`,
        [fileId, targetFileId, targetTitle, prop.relationship, prop.context, now]
      );
      createdSuggestions.push({
        id: res.lastID,
        source_file_id: fileId,
        target_file_id: targetFileId,
        target_title: targetTitle,
        relationship: prop.relationship,
        context: prop.context,
        is_ai_suggested: 1,
        status: 'pending',
      });
    }
  }

  await dbRun(
    `INSERT INTO agent_runs (file_id, raw_response, created_at) VALUES (?, ?, ?)`,
    [fileId, rawResponseLog, now]
  );

  return createdSuggestions;
}

/**
 * Universal Academic Note Synthesis
 */
export async function synthesizeWithUniversalAI({ rawTitle, rawContent, existingTitles = [], aiConfig }) {
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('Note content is empty. Add notes or lecture scribbles to synthesize.');
  }

  const provider = aiConfig?.provider || 'groq';
  const apiKey = aiConfig?.apiKey || '';
  const model = aiConfig?.model || AI_PROVIDERS[provider]?.defaultModel;

  const systemPrompt = `You are a distinguished University Professor, Pedagogue, and Principal Academic Researcher.
Your mission is to take an informal, fragmented student's raw classroom notes or user intuition, and transform them into a comprehensive, textbook-grade "Formal Academic Note".

You MUST return your response strictly as a JSON object conforming to this exact structure:
{
  "formalTitle": "Formal note title (e.g. 'Backpropagation: Theoretical Foundations & Gradient Calculus')",
  "executiveSummary": "1-2 sentence high-level definition and academic summary",
  "intuitionBridge": "A clear preservation of the user's raw intuitive mental model and analogies, explaining why this concept makes intuitive sense before diving into formal math.",
  "definitions": [
    {
      "term": "Name of concept/variable",
      "definition": "Formal scientific/mathematical definition",
      "formula": "LaTeX formula (or null if purely qualitative)"
    }
  ],
  "derivations": [
    {
      "title": "Title of derivation/proof",
      "premise": "Starting assumption or objective",
      "steps": ["Step 1 with LaTeX...", "Step 2 with LaTeX..."],
      "conclusion": "Final resulting expression"
    }
  ],
  "keyTheorems": [
    {
      "name": "Name of theorem/law/rule",
      "statement": "Formal statement or formula",
      "implication": "What this means in practical computation"
    }
  ],
  "crucialInsights": [
    "Important edge case, numerical stability, caveat, or best practice"
  ],
  "suggestedVaultWikilinks": [
    {
      "title": "Exact title of a connected note from available vault list",
      "relationship": "relies_on | prerequisite_for | generalizes | implements | complements",
      "context": "Why these concepts are coupled"
    }
  ]
}

STRICT ACADEMIC GUIDELINES:
1. PRESERVE THE RAW INTUITION: Never discard the student's informal intuitions, shorthand, or analogies. Explain and elevate them into clear conceptual anchors.
2. RIGOROUS FORMULAS & DERIVATIONS: If mathematics is involved, write full LaTeX expressions (use $...$ for inline and $$...$$ for block math). Avoid skipping steps. DO NOT invent fictitious derivations if the topic is non-mathematical; instead, provide the rigorous conceptual framework.
3. VAULT INTEGRATION: Connect to available vault topics using the exact available titles list.
4. VALID JSON ONLY: Return ONLY the raw valid JSON string. No Markdown fences (\`\`\`json) outside the JSON.`;

  const userPrompt = `Source Note Title: "${rawTitle}"

Available Vault Note Titles (to link against):
${JSON.stringify(existingTitles.slice(0, 40), null, 2)}

User's Raw Class/Study Notes:
"""
${rawContent}
"""

Produce the structured JSON academic synthesis now.`;

  const result = await callUniversalLLM({
    provider,
    apiKey,
    model,
    baseUrl: aiConfig?.baseUrl,
    systemPrompt,
    userPrompt,
    jsonMode: true,
    temperature: 0.25,
    maxTokens: 4096,
  });

  const structuredOutput = parseJSONFromLLM(result.content);

  return {
    structuredOutput,
    model: result.model,
    provider: result.provider,
    promptVersion: CURRENT_PROMPT_VERSION,
  };
}

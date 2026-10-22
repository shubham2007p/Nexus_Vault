import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { syncFileLinks } from './parser.js';

dotenv.config();

export const CURRENT_PROMPT_VERSION = 'v1.2.0-academic-rigor';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const FALLBACK_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'];
const MAX_RAW_CONTENT_CHARS = 50000;
const TIMEOUT_MS = 35000;

/**
 * Interface definition for pluggable synthesis providers.
 * Any other provider (e.g. Claude, OpenAI, Local Ollama) can implement this interface.
 */
export class ISynthesisProvider {
  async synthesize({ rawTitle, rawContent, existingTitles }) {
    throw new Error('synthesize() must be implemented by provider');
  }
}

/**
 * Groq LPU High-Speed Inference Provider
 */
export class GroqSynthesisProvider extends ISynthesisProvider {
  constructor(apiKey = process.env.GROQ_API_KEY, model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async synthesize({ rawTitle, rawContent, existingTitles = [] }) {
    if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey.startsWith('your_')) {
      throw new Error('GROQ_API_KEY is not configured on the server. Please check your .env file.');
    }

    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error('Note content is empty. Add notes or lecture scribbles to synthesize.');
    }

    if (rawContent.length > MAX_RAW_CONTENT_CHARS) {
      throw new Error(`Note content exceeds safe character limit of ${MAX_RAW_CONTENT_CHARS} characters.`);
    }

    const groq = new Groq({ apiKey: this.apiKey });

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

    // Abort controller for safe timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const candidateModels = [this.model, ...FALLBACK_MODELS.filter((m) => m !== this.model)];
    let chatCompletion = null;
    let successfulModel = this.model;
    let lastErr = null;

    try {
      for (const modelToTry of candidateModels) {
        try {
          chatCompletion = await groq.chat.completions.create(
            {
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              model: modelToTry,
              response_format: { type: 'json_object' },
              temperature: 0.25, // Low temperature for mathematical precision and consistency
              max_tokens: 4096,
            },
            { signal: controller.signal }
          );
          successfulModel = modelToTry;
          break;
        } catch (tryErr) {
          lastErr = tryErr;
          if (tryErr?.status === 404 || tryErr?.message?.includes('does not exist') || tryErr?.code === 'model_not_found') {
            console.warn(`Groq model "${modelToTry}" not accessible, attempting fallback...`);
            continue;
          }
          throw tryErr;
        }
      }

      clearTimeout(timeoutId);

      if (!chatCompletion) {
        throw lastErr || new Error('No accessible Groq model found for this API key.');
      }

      const rawResponseText = chatCompletion.choices[0]?.message?.content || '{}';
      
      // Safe JSON parsing with fallback cleanup
      let structuredOutput;
      try {
        structuredOutput = JSON.parse(rawResponseText);
      } catch (parseErr) {
        // Strip any markdown codeblock fences if returned
        const cleaned = rawResponseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        structuredOutput = JSON.parse(cleaned);
      }

      // Validate required fields
      if (!structuredOutput.formalTitle) {
        structuredOutput.formalTitle = `${rawTitle} (Formal)`;
      }
      if (!Array.isArray(structuredOutput.definitions)) {
        structuredOutput.definitions = [];
      }
      if (!Array.isArray(structuredOutput.derivations)) {
        structuredOutput.derivations = [];
      }
      if (!Array.isArray(structuredOutput.crucialInsights)) {
        structuredOutput.crucialInsights = [];
      }

      return {
        promptVersion: CURRENT_PROMPT_VERSION,
        model: successfulModel,
        structuredOutput,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Groq request timed out after ${TIMEOUT_MS / 1000} seconds. Please try again.`);
      }
      throw err;
    }
  }
}

/**
 * Deterministic Backend Markdown Renderer:
 * Converts structured synthesis JSON into a clean, standard Obsidian-compatible Markdown document.
 */
export function renderFormalMarkdown({ rawTitle, structuredData, model, promptVersion }) {
  const data = structuredData || {};
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const lines = [];

  // Top Callout linking to the raw user note
  lines.push(`> [!ABSTRACT] Formal Academic Synthesis`);
  lines.push(`> 📝 **Original Raw Notes:** [[${rawTitle}]]`);
  lines.push(`> ⚡ **Generated via Groq LPU** (${model || DEFAULT_GROQ_MODEL} • Prompt \`${promptVersion || CURRENT_PROMPT_VERSION}\` • ${dateStr})`);
  lines.push('');

  // Title & Executive Summary
  lines.push(`# ${data.formalTitle || `${rawTitle} (Formal)`}`);
  lines.push('');
  if (data.executiveSummary) {
    lines.push(data.executiveSummary.trim());
    lines.push('');
  }

  // Section 1: Preserved Intuition
  if (data.intuitionBridge) {
    lines.push('## 🧠 Intuition & Conceptual Model');
    lines.push('');
    lines.push(data.intuitionBridge.trim());
    lines.push('');
  }

  // Section 2: Rigorous Definitions
  if (data.definitions && data.definitions.length > 0) {
    lines.push('## 📚 Formal Definitions & Foundations');
    lines.push('');
    data.definitions.forEach((def) => {
      lines.push(`### ${def.term}`);
      lines.push(`${def.definition}`);
      if (def.formula) {
        lines.push('');
        lines.push(`$$${def.formula.replace(/^\$\$|\$\$$/g, '').trim()}$$`);
      }
      lines.push('');
    });
  }

  // Section 3: Mathematical Formulations & Derivations
  if (data.derivations && data.derivations.length > 0) {
    lines.push('## 📐 Mathematical Formulation & Step-by-Step Derivations');
    lines.push('');
    data.derivations.forEach((deriv) => {
      lines.push(`### ${deriv.title}`);
      if (deriv.premise) {
        lines.push(`**Premise / Objective:** ${deriv.premise}`);
        lines.push('');
      }
      if (Array.isArray(deriv.steps) && deriv.steps.length > 0) {
        lines.push('**Step-by-Step Derivation:**');
        deriv.steps.forEach((step, idx) => {
          lines.push(`${idx + 1}. ${step}`);
        });
        lines.push('');
      }
      if (deriv.conclusion) {
        lines.push(`> **Conclusion:** ${deriv.conclusion}`);
        lines.push('');
      }
    });
  }

  // Section 4: Key Theorems / Laws
  if (data.keyTheorems && data.keyTheorems.length > 0) {
    lines.push('## ⚖️ Core Theorems & Principles');
    lines.push('');
    data.keyTheorems.forEach((thm) => {
      lines.push(`- **${thm.name}**: ${thm.statement}`);
      if (thm.implication) {
        lines.push(`  - *Implication:* ${thm.implication}`);
      }
    });
    lines.push('');
  }

  // Section 5: Key Takeaways & Caveats
  if (data.crucialInsights && data.crucialInsights.length > 0) {
    lines.push('## 💡 Key Takeaways & Numerical Caveats');
    lines.push('');
    data.crucialInsights.forEach((insight) => {
      lines.push(`- ${insight}`);
    });
    lines.push('');
  }

  // Section 6: Vault Knowledge Graph Connections
  lines.push('## 🔗 Vault Connections');
  lines.push('');
  // Explicitly link back to source raw note with contextual syntax
  lines.push(`- [[${rawTitle} | synthesizes | Formal academic derivation of raw user notes]]`);

  if (Array.isArray(data.suggestedVaultWikilinks)) {
    data.suggestedVaultWikilinks.forEach((link) => {
      if (link.title && link.title.toLowerCase() !== rawTitle.toLowerCase()) {
        const rel = link.relationship || 'relies_on';
        const ctx = link.context || 'Related domain concept';
        lines.push(`- [[${link.title} | ${rel} | ${ctx}]]`);
      }
    });
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Resilient graph synchronization with exponential backoff retry.
 */
export async function syncGraphWithRetry(fileId, content, maxRetries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      await syncFileLinks(fileId, content);
      return { success: true, attempts: attempt + 1 };
    } catch (err) {
      attempt++;
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 150; // 300ms, 600ms...
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  return { success: false, error: lastError?.message || 'Failed to sync graph links' };
}

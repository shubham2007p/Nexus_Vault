import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { syncFileLinks } from './parser.js';

dotenv.config();

export const CURRENT_PROMPT_VERSION = 'v2.0.0-academic-rigor';
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
      throw new Error('GROQ_API_KEY is not configured on the server. Please check your .env file or AI Settings.');
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

      const responseContent = chatCompletion.choices?.[0]?.message?.content;
      if (!responseContent) {
        throw new Error('Groq returned empty response content.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseContent);
      } catch (parseErr) {
        // Fallback: strip markdown fences if Groq returned ```json ... ```
        const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          parsedData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse structured JSON from LLM response.');
        }
      }

      return {
        rawTitle,
        rawContent,
        model: successfulModel,
        promptVersion: CURRENT_PROMPT_VERSION,
        structuredOutput: parsedData,
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
export function renderFormalMarkdown({ rawTitle, structuredData, model, promptVersion, provider }) {
  const data = structuredData || {};
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const lines = [];

  // Top Callout linking to the raw user note
  const providerLabel = provider ? provider.toUpperCase() : 'AI ENGINE';
  lines.push(`> [!ABSTRACT] Formal Academic Synthesis`);
  lines.push(`> 📝 **Original Raw Notes:** [[${rawTitle}]]`);
  lines.push(`> ⚡ **Generated via ${providerLabel}** (${model || DEFAULT_GROQ_MODEL} • Prompt \`${promptVersion || CURRENT_PROMPT_VERSION}\` • ${dateStr})`);
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
    lines.push('## Intuitive Foundation & Mental Models');
    lines.push('');
    lines.push(data.intuitionBridge.trim());
    lines.push('');
  }

  // Section 2: Rigorous Definitions
  if (Array.isArray(data.definitions) && data.definitions.length > 0) {
    lines.push('## Core Definitions & Formalism');
    lines.push('');
    for (const def of data.definitions) {
      lines.push(`- **${def.term}**: ${def.definition}`);
      if (def.formula) {
        lines.push(`  $$\n  ${def.formula.replace(/^\$\$|\$\$$/g, '').trim()}\n  $$`);
      }
    }
    lines.push('');
  }

  // Section 3: Mathematical Derivations & Step-by-Step Proofs
  if (Array.isArray(data.derivations) && data.derivations.length > 0) {
    lines.push('## Mathematical Derivations');
    lines.push('');
    for (const d of data.derivations) {
      lines.push(`### ${d.title}`);
      if (d.premise) {
        lines.push(`**Premise / Objective:** ${d.premise}`);
        lines.push('');
      }
      if (Array.isArray(d.steps)) {
        d.steps.forEach((step, idx) => {
          lines.push(`${idx + 1}. ${step}`);
        });
        lines.push('');
      }
      if (d.conclusion) {
        lines.push(`> **Result:**\n> $$\n> ${d.conclusion.replace(/^\$\$|\$\$$/g, '').trim()}\n> $$`);
        lines.push('');
      }
    }
  }

  // Section 4: Key Theorems & Laws
  if (Array.isArray(data.keyTheorems) && data.keyTheorems.length > 0) {
    lines.push('## Theorems & Computational Laws');
    lines.push('');
    for (const th of data.keyTheorems) {
      lines.push(`> [!THEOREM] ${th.name}`);
      lines.push(`> ${th.statement}`);
      if (th.implication) {
        lines.push(`>\n> *Implication:* ${th.implication}`);
      }
      lines.push('');
    }
  }

  // Section 5: Crucial Insights & Numerical Caveats
  if (Array.isArray(data.crucialInsights) && data.crucialInsights.length > 0) {
    lines.push('## Crucial Insights & Practical Caveats');
    lines.push('');
    for (const insight of data.crucialInsights) {
      lines.push(`- ${insight}`);
    }
    lines.push('');
  }

  // Section 6: Contextual Vault Wikilinks
  if (Array.isArray(data.suggestedVaultWikilinks) && data.suggestedVaultWikilinks.length > 0) {
    lines.push('## Related Connections');
    lines.push('');
    for (const link of data.suggestedVaultWikilinks) {
      if (link.title) {
        if (link.relationship && link.context) {
          lines.push(`- [[${link.title} | ${link.relationship} | ${link.context}]]`);
        } else {
          lines.push(`- [[${link.title}]]`);
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Robust Graph Synchronization with Exponential Backoff Retry.
 */
export async function syncGraphWithRetry(fileId, content, maxRetries = 3) {
  let attempt = 0;
  let delay = 100;

  while (attempt < maxRetries) {
    try {
      await syncFileLinks(fileId, content);
      return { success: true, attempts: attempt + 1 };
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        console.error(`Failed to synchronize vault graph after ${maxRetries} attempts:`, err);
        return { success: false, error: err.message, attempts: attempt };
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

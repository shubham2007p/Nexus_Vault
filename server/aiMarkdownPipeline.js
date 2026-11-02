import { callUniversalLLM, resolveAIConfig, AI_PROVIDERS } from './universalAi.js';

/**
 * Universal Markdown System Prompt Contract
 * 
 * Establishes the canonical formatting rules for all AI-generated content in Nexus Vault.
 * Guarantees compatibility with Nexus Vault's MarkdownRenderer (KaTeX, GFM, Callouts, Code Blocks, Wiki Links).
 */
export const UNIVERSAL_MARKDOWN_CONTRACT = `
CANONICAL FORMATTING CONTRACT FOR NEXUS VAULT:
1. FORMAT: Output MUST be valid, clean GitHub Flavored Markdown (GFM).
2. DELIMITER INTEGRITY: All delimiters must be strictly balanced.
   - Every fenced code block must open with \`\`\`<lang> and close with \`\`\`.
   - Inline math MUST use single dollar signs: $...$ with no inner leading/trailing spaces (e.g. $E = mc^2$).
   - Standalone display math MUST use double dollar signs on separate lines:
     $$
     \\mathbf{z}^{(l)} = \\mathbf{W}^{(l)}\\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}
     $$
   - Do NOT use LaTeX brackets like \\[ \\] or \\( \\) for mathematics; use $$ and $.
3. CODE BLOCKS: Always provide a recognized lowercase language identifier for code blocks:
   - Common: python, javascript, typescript, c, cpp, java, html, css, json, sql, bash, markdown, go, rust, php, yaml.
4. OBSIDIAN CALLOUTS: Use standard Obsidian-compatible callout syntax when highlighting caveats, theorems, or summaries:
   > [!NOTE]
   > Core informative note text.

   Supported types: NOTE, ABSTRACT, TIP, IMPORTANT, WARNING, CAUTION, QUESTION, QUOTE, THEOREM.
5. TABLES: GFM tables must have valid alignment hyphens (| --- | --- |) and balanced pipes.
6. VAULT WIKI LINKS: When referencing related topics in the user's vault, format them as:
   - Plain link: [[Target Note Title]]
   - Contextual link: [[Target Note Title | relationship | context]]
7. RESTRAINT: Do NOT generate tables, callouts, or complex math merely for decoration. Use each construct only when it materially clarifies the subject.
8. FACTUAL INTEGRITY: Never invent fictitious citations, non-existent formulas, or unrunnable code. Preserve technical accuracy. Never silently omit critical source details.
`.trim();

/**
 * Task-Specific Prompt Layers
 */
export const TASK_PROMPTS = {
  chattyfi_conversation: `
TASK: Conversational Study & Research Assistant (ChattyFi).
- Engage naturally as an expert pair programmer and research mentor.
- Respond conversationally, directly addressing the user's query without forcing artificial document structure.
- Answer simple or conversational questions concisely.
- Introduce technical constructs (code blocks, equations, tables, callouts) only when they directly explain the concept.
- When referencing concepts existing in the vault, use [[Note Title]] wiki links.
`.trim(),

  formal_note: `
TASK: Formal Academic Textbook Note Generation.
- Synthesize the subject into a rigorous, textbook-grade reference document.
- Follow a clear structural progression:
  1. # Formal Title
  2. Executive summary / primary thesis.
  3. ## Intuitive Foundation & Mental Models (preserve intuitive analogies).
  4. ## Core Definitions & Formalism (with inline $...$ or display $$...$$ math).
  5. ## Mathematical Derivations or Algorithmic Mechanics (step-by-step proofs).
  6. ## Theorems & Computational Invariants (use > [!THEOREM] or > [!IMPORTANT]).
  7. ## Practical Caveats & Complexity (tables of time/space complexity or numerical stability).
  8. ## Related Connections (contextual [[Wiki Links]]).
`.trim(),

  raw_synthesis: `
TASK: Raw Notes Synthesis & Elevation.
- Take fragmented student or meeting notes and elevate them into a polished reference note.
- CRITICAL: Never discard the student's informal analogies, shorthand, or mental models. Elevate and preserve them alongside formal definitions.
- Connect related notes with [[Note Title | relationship | context]].
`.trim(),

  concept_explanation: `
TASK: Deep Conceptual & Theoretical Explanation.
- Build understanding intuitively first with an accessible analogy.
- Transition into the rigorous mathematical or structural definition.
- Provide a concrete example and highlight edge cases using > [!WARNING] or > [!TIP].
`.trim(),

  programming_explanation: `
TASK: Programming & Engineering Implementation Breakdown.
- Explain the algorithmic logic clearly.
- Provide idiomatic, runnable, syntax-highlighted code blocks with exact language labels.
- Analyze time complexity and space complexity with a clean GFM table.
- Address practical engineering considerations (memory footprint, concurrency, error handling).
`.trim(),

  knowledge_extraction: `
TASK: Knowledge Extraction & Atomic Invariant Synthesis.
- Extract the essential invariants, key formulas, and primary definitions.
- Present concise bullet points and link to foundational vault notes with [[Target Note]].
`.trim(),
};

/**
 * Builds the composite system prompt by combining the universal contract with task-specific guidelines
 */
export function buildCompositeSystemPrompt(task = 'chattyfi_conversation', customContext = {}) {
  const taskPrompt = TASK_PROMPTS[task] || TASK_PROMPTS.chattyfi_conversation;
  const vaultTitles = Array.isArray(customContext.vaultTitles) ? customContext.vaultTitles : [];

  let contextAddition = '';
  if (vaultTitles.length > 0) {
    contextAddition = `\n\nAVAILABLE VAULT NOTE TITLES (link to these where relevant using [[Note Title]]):\n${JSON.stringify(
      vaultTitles.slice(0, 50),
      null,
      2
    )}`;
  }

  return `${UNIVERSAL_MARKDOWN_CONTRACT}\n\n${taskPrompt}${contextAddition}`;
}

/**
 * Lightweight Markdown Validator and Safe Repair Normalizer
 * 
 * Checks for:
 * - Unclosed fenced code blocks (```)
 * - LaTeX bracket delimiters (\\[...\\], \\(...\\)) -> converts to standard $$ and $
 * - Unclosed display math ($$)
 * - Malformed callouts (> [!note] -> > [!NOTE])
 * - Malformed frontmatter (unclosed ---)
 * - Empty content check
 */
export function validateAndNormalizeMarkdown(rawMarkdown, options = {}) {
  const issues = [];
  const repairsApplied = [];

  if (typeof rawMarkdown !== 'string' || rawMarkdown.trim().length === 0) {
    return {
      content: '',
      original: rawMarkdown || '',
      isValid: false,
      repairsApplied: [],
      issues: ['Generation result is empty or null.'],
    };
  }

  let text = rawMarkdown;

  // 1. Check for unclosed fenced code blocks
  // Find lines starting with 3 or more backticks
  const fenceRegex = /^(`{3,})([a-zA-Z0-9_-]*)\s*$/gm;
  let match;
  let inCode = false;
  let activeMarker = '';
  while ((match = fenceRegex.exec(text)) !== null) {
    const marker = match[1];
    if (!inCode) {
      inCode = true;
      activeMarker = marker;
    } else {
      if (marker.length >= activeMarker.length) {
        inCode = false;
        activeMarker = '';
      }
    }
  }

  if (inCode) {
    text = text.trimEnd() + '\n```\n';
    repairsApplied.push('closed_unfenced_code_block');
    issues.push('Unclosed code fence detected; safely appended closing fence.');
  }

  // 2. Protect fenced code blocks with placeholders so inner content is NEVER corrupted
  const codeBlocks = [];
  const blockPlaceholderPrefix = '___VAULT_CODE_BLOCK_';
  // Match full code fences: ```lang ... ```
  text = text.replace(/(^```[a-zA-Z0-9_-]*\r?\n[\s\S]*?\r?\n```\s*$)/gm, (fullBlock) => {
    const id = codeBlocks.length;
    codeBlocks.push(fullBlock);
    return `${blockPlaceholderPrefix}${id}___`;
  });

  // 3. Normalize LaTeX bracket delimiters on PROSE ONLY
  // Convert display math: \[ ... \] -> $$ ... $$
  if (/\\\[[\s\S]*?\\\]/.test(text)) {
    text = text.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (m, expr) => {
      repairsApplied.push('normalized_display_latex_brackets');
      return `$$\n${expr.trim()}\n$$`;
    });
  }

  // Convert inline math: \( ... \) -> $ ... $
  if (/\\\([\s\S]*?\\\)/.test(text)) {
    text = text.replace(/\\\(\s*([^\n]+?)\s*\\\)/g, (m, expr) => {
      repairsApplied.push('normalized_inline_latex_parentheses');
      return `$${expr.trim()}$`;
    });
  }

  // 4. Normalize Obsidian Callouts on PROSE ONLY
  text = text.replace(/^(\s*>+)\s*\[!([a-zA-Z]+)\]/gm, (m, prefix, type) => {
    const upperType = type.toUpperCase();
    if (m !== `${prefix} [!${upperType}]`) {
      repairsApplied.push(`normalized_callout_${upperType}`);
    }
    return `${prefix} [!${upperType}]`;
  });

  // 5. Check for unclosed display math ($$) on PROSE ONLY
  const displayMathMatches = text.match(/\$\$/g);
  const mathCount = displayMathMatches ? displayMathMatches.length : 0;
  if (mathCount % 2 !== 0) {
    text = text.trimEnd() + '\n$$\n';
    repairsApplied.push('closed_unmatched_display_math');
    issues.push('Odd number of $$ math delimiters detected in prose; safely appended closing $$.');
  }

  // 6. Check for unclosed YAML frontmatter
  // Only treat leading --- as frontmatter if it contains actual YAML keys (e.g. `key: value`)
  // Not when followed immediately by empty line (which is a horizontal rule / thematic break)
  if (text.startsWith('---\n') || text.startsWith('---\r\n')) {
    const afterFirst = text.slice(4);
    const secondIndex = afterFirst.indexOf('\n---');
    if (secondIndex === -1) {
      const firstBlank = text.indexOf('\n\n');
      if (firstBlank !== -1) {
        const headerCandidate = text.slice(4, firstBlank);
        if (/^[a-zA-Z0-9_-]+\s*:/m.test(headerCandidate)) {
          text = text.slice(0, firstBlank) + '\n---' + text.slice(firstBlank);
          repairsApplied.push('closed_unclosed_frontmatter');
          issues.push('Unclosed frontmatter header; safely inserted closing --- delimiter.');
        }
      }
    }
  }

  // 7. Restore protected code blocks exactly
  for (let i = 0; i < codeBlocks.length; i++) {
    text = text.replace(`${blockPlaceholderPrefix}${i}___`, codeBlocks[i]);
  }

  return {
    content: text,
    original: rawMarkdown,
    isValid: true,
    repairsApplied: Array.from(new Set(repairsApplied)),
    issues,
  };
}

/**
 * Generate Unified AI Markdown Response
 * 
 * Main backend pipeline:
 * 1. Combines universal contract + task-specific instructions + vault context.
 * 2. Dispatches to active AI provider via universalAi.
 * 3. Normalizes and validates Markdown with safe repairs.
 * 4. Returns validated Markdown with generation metadata.
 */
export async function generateUnifiedAIMarkdown({
  task = 'chattyfi_conversation',
  prompt = '',
  conversationHistory = [],
  vaultTitles = [],
  aiConfig = null,
  temperature = 0.3,
  maxTokens = 4096,
}) {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Prompt is required for AI Markdown generation.');
  }

  const systemPrompt = buildCompositeSystemPrompt(task, { vaultTitles });

  // Format conversational context if provided
  let formattedUserPrompt = prompt;
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .slice(-6)
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    formattedUserPrompt = `CONVERSATION CONTEXT:\n${historyText}\n\nCURRENT USER REQUEST:\n${prompt}`;
  }

  // Resolve AI configuration
  const resolvedConfig = aiConfig || (await resolveAIConfig(null));
  const provider = resolvedConfig.provider || 'groq';
  const apiKey = resolvedConfig.apiKey || '';
  const model = resolvedConfig.model || AI_PROVIDERS[provider]?.defaultModel;

  // If no API key is configured or offline development fallback is triggered:
  // Generate a high-fidelity contract-compliant mock response matching the task!
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('your_')) {
    const fallbackResponse = buildContractCompliantFallback({
      task,
      prompt,
      vaultTitles,
    });
    const validated = validateAndNormalizeMarkdown(fallbackResponse);
    return {
      content: validated.content,
      rawContent: fallbackResponse,
      model: `${model || 'openai/gpt-oss-120b'} (offline-heuristic)`,
      provider: `${provider} (fallback)`,
      task,
      isValid: validated.isValid,
      repairsApplied: validated.repairsApplied,
      issues: validated.issues,
    };
  }

  // Live LLM dispatch through universal provider abstraction
  const result = await callUniversalLLM({
    provider,
    apiKey,
    model,
    baseUrl: resolvedConfig.baseUrl,
    systemPrompt,
    userPrompt: formattedUserPrompt,
    jsonMode: false,
    temperature,
    maxTokens,
  });

  const rawOutput = result.content || '';
  const validated = validateAndNormalizeMarkdown(rawOutput);

  return {
    content: validated.content,
    rawContent: rawOutput,
    model: result.model,
    provider: result.provider,
    task,
    isValid: validated.isValid,
    repairsApplied: validated.repairsApplied,
    issues: validated.issues,
  };
}

/**
 * Deterministic, contract-compliant fallback generator for test and offline dev environments.
 * Strictly adheres to UNIVERSAL_MARKDOWN_CONTRACT.
 */
function buildContractCompliantFallback({ task, prompt, vaultTitles = [] }) {
  const primaryTitle = vaultTitles[0] || 'Data Structures and Algorithms';
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();

  // 1. Math Derivation Response
  if (lower.includes('math') || lower.includes('backprop') || lower.includes('gradient') || lower.includes('equation')) {
    return [
      '### Matrix Chain Rule & Backpropagation Derivation',
      '',
      'In a multilayer neural network with pre-activation $\\mathbf{z}^{(l)} = \\mathbf{W}^{(l)}\\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}$ and activation $\\mathbf{a}^{(l)} = \\sigma(\\mathbf{z}^{(l)})$, the sensitivity vector is:',
      '',
      '$$\\boldsymbol{\\delta}^{(l)} = \\left((\\mathbf{W}^{(l+1)})^\\top \\boldsymbol{\\delta}^{(l+1)}\\right) \\odot \\sigma\'(\\mathbf{z}^{(l)})$$',
      '',
      'Parameter gradients follow directly as outer products:',
      '',
      '$$\\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{W}^{(l)}} = \\boldsymbol{\\delta}^{(l)} (\\mathbf{a}^{(l-1)})^\\top, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{b}^{(l)}} = \\boldsymbol{\\delta}^{(l)}$$',
      '',
      '> [!NOTE]',
      '> Numerical stability requires careful scaling of gradient magnitudes across layers.',
      '',
      `Connected vault topic: [[${primaryTitle}]].`,
    ].join('\n');
  }

  // 2. Programming Explanation
  if (lower.includes('code') || lower.includes('algorithm') || lower.includes('python') || lower.includes('implementation')) {
    return [
      '### Dijkstra Shortest Path Algorithm',
      '',
      'Dijkstra finds the single-source shortest path on weighted graphs with non-negative edge weights using a min-priority queue.',
      '',
      '```python',
      'import heapq',
      '',
      'def dijkstra(graph, start):',
      '    distances = {node: float("inf") for node in graph}',
      '    distances[start] = 0',
      '    pq = [(0, start)]',
      '    while pq:',
      '        curr_dist, u = heapq.heappop(pq)',
      '        if curr_dist > distances[u]:',
      '            continue',
      '        for v, weight in graph[u].items():',
      '            dist = curr_dist + weight',
      '            if dist < distances[v]:',
      '                distances[v] = dist',
      '                heapq.heappush(pq, (dist, v))',
      '    return distances',
      '```',
      '',
      '#### Complexity Profile',
      '',
      '| Data Structure | Time Complexity | Space Complexity |',
      '| :--- | :--- | :--- |',
      '| Binary Heap | $\\mathcal{O}((V + E) \\log V)$ | $\\mathcal{O}(V)$ |',
      '| Fibonacci Heap | $\\mathcal{O}(E + V \\log V)$ | $\\mathcal{O}(V)$ |',
      '',
      `See related note: [[${primaryTitle} | implements | Graph Traversal]].`,
    ].join('\n');
  }

  // 3. Comparison / Table
  if (lower.includes('compare') || lower.includes('table') || lower.includes('difference')) {
    return [
      '### Algorithmic Trade-off Comparison',
      '',
      'A structured comparison of foundational search methodologies:',
      '',
      '| Approach | Strategy | Completeness | Optimality | Time Complexity |',
      '| :--- | :--- | :--- | :--- | :--- |',
      '| Breadth-First Search (BFS) | Queue FIFO | Yes (if $b < \\infty$) | Yes (unit costs) | $\\mathcal{O}(b^d)$ |',
      '| Depth-First Search (DFS) | Stack LIFO | No (infinite depth) | No | $\\mathcal{O}(b^m)$ |',
      '| A* Heuristic Search | Priority Queue | Yes | Yes (admissible $h$) | $\\mathcal{O}(b^d)$ |',
      '',
      '> [!TIP]',
      '> For state spaces with uniform edge weights, BFS guarantees shortest paths without priority queue overhead.',
    ].join('\n');
  }

  // 4. Theorem / Warning
  if (lower.includes('theorem') || lower.includes('proof') || lower.includes('warning') || lower.includes('caveat')) {
    return [
      '### Spectral Graph Theory & Partitioning',
      '',
      '> [!THEOREM]',
      '> Cheeger Inequality: For any $d$-regular graph $G$ with normalized Laplacian second eigenvalue $\\lambda_2$, the graph conductance $\\phi(G)$ satisfies:',
      '> $$\\frac{\\lambda_2}{2} \\le \\phi(G) \\le \\sqrt{2\\lambda_2}$$',
      '',
      '> [!WARNING]',
      '> Graph partitioning heuristics based purely on spectral bisection may degenerate if disconnected components produce multiplicity of $\\lambda_1 = 0$.',
      '',
      `Linked vault concept: [[${primaryTitle}]].`,
    ].join('\n');
  }

  // 5. Formal Note Generation
  if (task === 'formal_note' || task === 'raw_synthesis') {
    return [
      `# ${cleanPrompt.slice(0, 60)}: Theoretical Foundations`,
      '',
      'This formal reference document synthesizes foundational principles, mathematical formulations, and system invariants.',
      '',
      '## Intuitive Foundation & Mental Models',
      'The concept can be intuitively understood by considering state transitions under conserved constraints. Rather than tracking all microscopic degrees of freedom, we track macroscopic invariants.',
      '',
      '## Core Definitions & Formalism',
      '- **State Space $\\mathcal{S}$**: The set of all admissible configurations.',
      '- **Transition Kernel $T(s\' \\mid s)$**: Conditional probability density governing system evolution.',
      '',
      '$$\\int_{\\mathcal{S}} T(s\' \\mid s) \\, ds\' = 1, \\qquad \\forall s \\in \\mathcal{S}$$',
      '',
      '## Practical Invariants',
      '- All transitions preserve invariant bounds.',
      `- Foundational reference: [[${primaryTitle}]].`,
    ].join('\n');
  }

  // 6. Conversational Default (Natural and non-bureaucratic!)
  return [
    `I have analyzed your query regarding **${cleanPrompt.slice(0, 72)}**.`,
    '',
    'Here are the key points to consider:',
    '',
    `1. **Core Concept**: This relates directly to the principles documented in [[${primaryTitle}]].`,
    '2. **Practical Implication**: When structuring knowledge, separating intuition from formal proofs preserves both rapid comprehension and academic rigor.',
    '',
    'Would you like to explore the formal mathematical derivation or examine a code implementation?',
  ].join('\n');
}


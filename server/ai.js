import Anthropic from '@anthropic-ai/sdk';
import { dbAll, dbRun, dbGet } from './db.js';

const PROPOSE_LINK_TOOL = {
  name: 'propose_link',
  description: 'Propose a new contextual link from the current file to another file in the vault.',
  input_schema: {
    type: 'object',
    properties: {
      target_title: {
        type: 'string',
        description: 'Exact title of the target note in the vault to link to.',
      },
      relationship: {
        type: 'string',
        description: 'Short relationship name (e.g., prerequisite_for, relies_on, generalizes, implements, extends).',
      },
      context: {
        type: 'string',
        description: 'Brief explanation of why these notes are connected.',
      },
      reasoning: {
        type: 'string',
        description: 'Reasoning behind proposing this connection.',
      },
    },
    required: ['target_title', 'relationship', 'context'],
  },
};

export async function processFileWithAI(fileId) {
  const currentFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
  if (!currentFile) {
    throw new Error('File not found');
  }

  // Get all other file titles
  const allOtherFiles = await dbAll(
    `SELECT id, title FROM files WHERE id != ?`,
    [fileId]
  );
  const titlesList = allOtherFiles.map((f) => f.title);
  const titleToIdMap = new Map(allOtherFiles.map((f) => [f.title.toLowerCase(), f.id]));

  // Get existing links for this file
  const existingLinks = await dbAll(
    `SELECT target_title FROM links WHERE source_file_id = ?`,
    [fileId]
  );
  const existingTargetTitles = new Set(
    existingLinks.map((l) => l.target_title.toLowerCase())
  );

  const availableTitles = titlesList.filter(
    (t) => !existingTargetTitles.has(t.toLowerCase())
  );

  let proposals = [];
  let rawResponseLog = '';

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_anthropic_api_key_here') {
    try {
      const anthropic = new Anthropic({ apiKey });
      const prompt = `You are an AI note curator analyzing an Obsidian-style knowledge vault.
Current Note Title: "${currentFile.title}"
Current Note Content:
"""
${currentFile.content}
"""

Available Target Note Titles in Vault:
${JSON.stringify(availableTitles, null, 2)}

Existing Links from this Note:
${JSON.stringify(Array.from(existingTargetTitles), null, 2)}

Instructions:
Propose 1 to 5 new contextual links from "${currentFile.title}" to existing target notes in the vault.
Only propose links to note titles that are in the Available Target Note Titles list.
Do not repeat existing links.
Call the "propose_link" tool for each proposed connection.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        tools: [PROPOSE_LINK_TOOL],
        tool_choice: { type: 'auto' },
        messages: [{ role: 'user', content: prompt }],
      });

      rawResponseLog = JSON.stringify(response, null, 2);

      const toolCalls = response.content.filter((c) => c.type === 'tool_use' && c.name === 'propose_link');
      for (const call of toolCalls) {
        proposals.push(call.input);
      }
    } catch (err) {
      console.warn('Anthropic API call failed or unconfigured, falling back to intelligent heuristic matcher:', err.message);
      proposals = generateHeuristicProposals(currentFile, availableTitles);
      rawResponseLog = `Heuristic fallback triggered: ${err.message}`;
    }
  } else {
    // Intelligent heuristic matcher when API key is not configured
    proposals = generateHeuristicProposals(currentFile, availableTitles);
    rawResponseLog = `Fallback heuristic engine used (ANTHROPIC_API_KEY not set). Propose count: ${proposals.length}`;
  }

  // Insert suggested links into DB
  const now = new Date().toISOString();
  const createdSuggestions = [];

  for (const prop of proposals) {
    const targetTitle = prop.target_title;
    const targetFileId = titleToIdMap.get(targetTitle.toLowerCase()) || null;
    
    // Ensure we don't insert duplicate pending suggestions
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

  // Log agent run
  await dbRun(
    `INSERT INTO agent_runs (file_id, raw_response, created_at) VALUES (?, ?, ?)`,
    [fileId, rawResponseLog, now]
  );

  return createdSuggestions;
}

function generateHeuristicProposals(currentFile, availableTitles) {
  const proposals = [];
  const contentLower = currentFile.content.toLowerCase();

  const relationshipTypes = [
    { rel: 'prerequisite_for', ctx: 'Provides foundational concepts required for understanding' },
    { rel: 'complements', ctx: 'Expands upon related techniques and complementary principles' },
    { rel: 'extends', ctx: 'Builds upon core mathematical or system architecture models' },
    { rel: 'applies_to', ctx: 'Demonstrates practical implementation and domain application' },
  ];

  let relIndex = 0;
  for (const title of availableTitles) {
    if (proposals.length >= 3) break;

    const titleLower = title.toLowerCase();
    // Match title keywords inside content
    const keywords = titleLower.split(' ').filter((w) => w.length > 3);
    const isMatched = keywords.some((k) => contentLower.includes(k));

    if (isMatched) {
      const relObj = relationshipTypes[relIndex % relationshipTypes.length];
      proposals.push({
        target_title: title,
        relationship: relObj.rel,
        context: `${relObj.ctx} ${title}`,
        reasoning: `Found relevant keyword reference in content of "${currentFile.title}".`,
      });
      relIndex++;
    }
  }

  // If no match found by keyword, suggest top 2 available titles as contextual connections
  if (proposals.length === 0 && availableTitles.length > 0) {
    for (let i = 0; i < Math.min(2, availableTitles.length); i++) {
      const title = availableTitles[i];
      const relObj = relationshipTypes[i % relationshipTypes.length];
      proposals.push({
        target_title: title,
        relationship: relObj.rel,
        context: `${relObj.ctx} ${title}`,
        reasoning: `Suggested domain connection between ${currentFile.title} and ${title}.`,
      });
    }
  }

  return proposals;
}

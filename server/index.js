import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, dbAll, dbGet, dbRun } from './db.js';
import { syncFileLinks } from './parser.js';
import { processFileWithAI } from './ai.js';
import { seedDatabase } from './seed.js';
import {
  renderFormalMarkdown,
  syncGraphWithRetry,
  CURRENT_PROMPT_VERSION,
  DEFAULT_GROQ_MODEL,
} from './synthesisService.js';
import {
  AI_PROVIDERS,
  detectProviderFromKey,
  resolveAIConfig,
  testAIConnection,
  processFileWithUniversalAI,
  synthesizeWithUniversalAI,
} from './universalAi.js';
import {
  initDiskFolders,
  syncFileToDisk,
  deleteFileFromDisk,
  syncAllFilesToDisk,
} from './diskSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB, Seed Data, and Disk Folders
await initDb();
await seedDatabase();
initDiskFolders();
await syncAllFilesToDisk();

// 1. GET /api/files - List all files with verified companion metadata
app.get('/api/files', async (req, res) => {
  try {
    const files = await dbAll(
      `SELECT f.id, f.title, f.path, f.note_type, 
              CASE WHEN rf.id IS NOT NULL THEN f.raw_file_id ELSE NULL END as raw_file_id, 
              CASE WHEN ff.id IS NOT NULL THEN f.formal_file_id ELSE NULL END as formal_file_id, 
              f.created_at, f.updated_at 
       FROM files f
       LEFT JOIN files ff ON (f.formal_file_id = ff.id AND (ff.note_type = 'formal' OR ff.path LIKE 'process/%'))
       LEFT JOIN files rf ON (f.raw_file_id = rf.id)
       ORDER BY f.title ASC`
    );
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/files - Create a file (defaults to raw folder unless formal)
app.post('/api/files', async (req, res) => {
  try {
    const { title, content, path: filePath, note_type = 'raw', raw_file_id = null } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const cleanTitle = title.trim();
    const folder = note_type === 'formal' ? 'process' : 'raw';
    let finalPath = filePath || `${folder}/${cleanTitle}.md`;
    const finalContent = content || '';
    const now = new Date().toISOString();

    // Check collision for path
    let counter = 1;
    while (await dbGet(`SELECT id FROM files WHERE path = ?`, [finalPath])) {
      finalPath = `${folder}/${cleanTitle} ${counter}.md`;
      counter++;
    }

    const result = await dbRun(
      `INSERT INTO files (title, path, content, note_type, raw_file_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanTitle, finalPath, finalContent, note_type, raw_file_id, now, now]
    );

    const fileId = result.lastID;
    await syncFileLinks(fileId, finalContent);

    const createdFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
    syncFileToDisk(createdFile);

    res.status(201).json(createdFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/files/:id - Get single file with companion note details
app.get('/api/files/:id', async (req, res) => {
  try {
    const file = await dbGet(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const links = await dbAll(
      `SELECT * FROM links WHERE source_file_id = ?`,
      [req.params.id]
    );

    // Retrieve companion note metadata
    let companionNote = null;
    if (file.formal_file_id) {
      companionNote = await dbGet(`SELECT id, title, path, updated_at FROM files WHERE id = ? AND (note_type = 'formal' OR path LIKE 'process/%')`, [file.formal_file_id]);
      if (!companionNote) {
        // Target note was deleted; self-heal pointer in database
        await dbRun(`UPDATE files SET formal_file_id = NULL WHERE id = ?`, [file.id]);
        file.formal_file_id = null;
      }
    } else if (file.raw_file_id) {
      companionNote = await dbGet(`SELECT id, title, path, updated_at FROM files WHERE id = ?`, [file.raw_file_id]);
      if (!companionNote) {
        // Target raw note was deleted; self-heal pointer in database
        await dbRun(`UPDATE files SET raw_file_id = NULL WHERE id = ?`, [file.id]);
        file.raw_file_id = null;
      }
    } else if (file.note_type !== 'formal' && !file.path.startsWith('process/')) {
      // Fallback check if formal note exists by raw_file_id match or title suffix
      const potential = await dbGet(
        `SELECT id, title, path, updated_at FROM files WHERE (raw_file_id = ? OR title = ?) AND (note_type = 'formal' OR path LIKE 'process/%') LIMIT 1`,
        [file.id, `${file.title} (Formal)`]
      );
      if (potential) {
        companionNote = potential;
        // Self-heal link in db
        await dbRun(`UPDATE files SET formal_file_id = ? WHERE id = ?`, [potential.id, file.id]);
        await dbRun(`UPDATE files SET raw_file_id = ?, note_type = 'formal' WHERE id = ?`, [file.id, potential.id]);
      }
    }

    res.json({ ...file, links, companionNote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/files/:id - Update file content and auto-sync links
app.put('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { title, content } = req.body;
    const existing = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
    if (!existing) {
      return res.status(404).json({ error: 'File not found' });
    }

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const folder = existing.note_type === 'formal' ? 'process' : 'raw';
    const newPath = `${folder}/${newTitle}.md`;
    const newContent = content !== undefined ? content : existing.content;
    const now = new Date().toISOString();

    await dbRun(
      `UPDATE files SET title = ?, path = ?, content = ?, updated_at = ? WHERE id = ?`,
      [newTitle, newPath, newContent, now, fileId]
    );

    await syncFileLinks(fileId, newContent);

    const updatedFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);

    // If title changed, clean up previous file from disk
    if (newTitle !== existing.title) {
      deleteFileFromDisk(existing);
    }
    syncFileToDisk(updatedFile);

    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/files/:id - Delete a file and decouple all relations
app.delete('/api/files/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const existing = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
    if (existing) {
      deleteFileFromDisk(existing);
    }
    // Clean up relation pointers across vault notes
    await dbRun(`UPDATE files SET formal_file_id = NULL WHERE formal_file_id = ?`, [fileId]);
    await dbRun(`UPDATE files SET raw_file_id = NULL WHERE raw_file_id = ?`, [fileId]);
    await dbRun(`DELETE FROM links WHERE source_file_id = ? OR target_file_id = ?`, [fileId, fileId]);
    await dbRun(`DELETE FROM files WHERE id = ?`, [fileId]);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/files/:id/backlinks - Backlinks for a specific file
app.get('/api/files/:id/backlinks', async (req, res) => {
  try {
    const targetFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!targetFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Direct incoming links by target_file_id OR target_title match
    const backlinks = await dbAll(
      `SELECT l.*, f.title as source_file_title, f.path as source_file_path
       FROM links l
       JOIN files f ON l.source_file_id = f.id
       WHERE l.target_file_id = ? OR LOWER(l.target_title) = ?
       ORDER BY l.created_at DESC`,
      [targetFile.id, targetFile.title.toLowerCase()]
    );

    res.json(backlinks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/files/:id/graph - Local graph (1-hop neighborhood)
app.get('/api/files/:id/graph', async (req, res) => {
  try {
    const centerId = parseInt(req.params.id, 10);
    const centerFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [centerId]);
    if (!centerFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Outgoing links (source = centerId)
    const outgoing = await dbAll(
      `SELECT l.*, f.title as target_title_actual, f.id as actual_target_id
       FROM links l
       LEFT JOIN files f ON (l.target_file_id = f.id OR LOWER(l.target_title) = LOWER(f.title))
       WHERE l.source_file_id = ?`,
      [centerId]
    );

    // Incoming links (target = centerId or title match)
    const incoming = await dbAll(
      `SELECT l.*, f.title as source_file_title, f.id as source_id
       FROM links l
       JOIN files f ON l.source_file_id = f.id
       WHERE l.target_file_id = ? OR LOWER(l.target_title) = ?`,
      [centerId, centerFile.title.toLowerCase()]
    );

    const nodesMap = new Map();
    nodesMap.set(centerFile.id, {
      id: centerFile.id,
      name: centerFile.title,
      path: centerFile.path,
      note_type: centerFile.note_type || 'raw',
      isCenter: true,
      val: 8,
    });

    const edges = [];

    // Process outgoing
    for (const link of outgoing) {
      let targetNodeId = link.actual_target_id;
      if (!targetNodeId) {
        targetNodeId = `ghost-${link.target_title}`;
        if (!nodesMap.has(targetNodeId)) {
          nodesMap.set(targetNodeId, {
            id: targetNodeId,
            name: link.target_title,
            isGhost: true,
            note_type: 'ghost',
            val: 3,
          });
        }
      } else {
        if (!nodesMap.has(targetNodeId)) {
          nodesMap.set(targetNodeId, {
            id: targetNodeId,
            name: link.target_title_actual || link.target_title,
            note_type: 'raw',
            val: 5,
          });
        }
      }

      edges.push({
        id: link.id,
        source: centerId,
        target: targetNodeId,
        relationship: link.relationship,
        context: link.context,
        is_ai_suggested: link.is_ai_suggested === 1,
        status: link.status,
      });
    }

    // Process incoming
    for (const link of incoming) {
      const sourceNodeId = link.source_id;
      if (!nodesMap.has(sourceNodeId)) {
        nodesMap.set(sourceNodeId, {
          id: sourceNodeId,
          name: link.source_file_title,
          note_type: 'raw',
          val: 5,
        });
      }

      edges.push({
        id: link.id,
        source: sourceNodeId,
        target: centerId,
        relationship: link.relationship,
        context: link.context,
        is_ai_suggested: link.is_ai_suggested === 1,
        status: link.status,
      });
    }

    res.json({
      nodes: Array.from(nodesMap.values()),
      edges,
      links: edges,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/graph - Global graph
app.get('/api/graph', async (req, res) => {
  try {
    const allFiles = await dbAll(`SELECT id, title, path, note_type, raw_file_id, formal_file_id FROM files`);
    const allLinks = await dbAll(`SELECT * FROM links`);

    const nodesMap = new Map();
    const titleToId = new Map();

    for (const file of allFiles) {
      nodesMap.set(file.id, {
        id: file.id,
        name: file.title,
        path: file.path,
        note_type: file.note_type || 'raw',
        raw_file_id: file.raw_file_id,
        formal_file_id: file.formal_file_id,
        val: file.note_type === 'formal' ? 6 : 5,
      });
      titleToId.set(file.title.toLowerCase(), file.id);
    }

    const edges = [];
    for (const link of allLinks) {
      let targetId = link.target_file_id;
      if (!targetId && link.target_title) {
        targetId = titleToId.get(link.target_title.toLowerCase());
      }

      if (!targetId) {
        const ghostId = `ghost-${link.target_title}`;
        if (!nodesMap.has(ghostId)) {
          nodesMap.set(ghostId, {
            id: ghostId,
            name: link.target_title,
            isGhost: true,
            note_type: 'ghost',
            val: 3,
          });
        }
        targetId = ghostId;
      }

      edges.push({
        id: link.id,
        source: link.source_file_id,
        target: targetId,
        relationship: link.relationship,
        context: link.context,
        is_ai_suggested: link.is_ai_suggested === 1,
        status: link.status,
      });
    }

    res.json({
      nodes: Array.from(nodesMap.values()),
      edges,
      links: edges,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/files/:id/process - Universal AI Link Suggestion
app.post('/api/files/:id/process', async (req, res) => {
  try {
    const fileId = req.params.id;
    const aiConfig = await resolveAIConfig(req);
    const suggestions = await processFileWithUniversalAI(fileId, aiConfig);
    res.json({
      success: true,
      suggestions,
      provider: aiConfig.provider,
      model: aiConfig.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/links/:id/accept - Accept an AI suggested link
app.post('/api/links/:id/accept', async (req, res) => {
  try {
    const linkId = req.params.id;
    const link = await dbGet(`SELECT * FROM links WHERE id = ?`, [linkId]);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Update link status
    await dbRun(
      `UPDATE links SET status = 'accepted', is_ai_suggested = 0 WHERE id = ?`,
      [linkId]
    );

    // Append link syntax into source file's markdown content
    const sourceFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [link.source_file_id]);
    if (sourceFile) {
      let linkSyntax = '';
      if (link.relationship && link.context) {
        linkSyntax = `[[${link.target_title} | ${link.relationship} | ${link.context}]]`;
      } else {
        linkSyntax = `[[${link.target_title}]]`;
      }

      // Append syntax under heading or at end of file if not present
      let updatedContent = sourceFile.content;
      if (!updatedContent.includes(linkSyntax)) {
        if (!updatedContent.includes('## Related Connections')) {
          updatedContent += `\n\n## Related Connections\n- ${linkSyntax}`;
        } else {
          updatedContent += `\n- ${linkSyntax}`;
        }

        const now = new Date().toISOString();
        await dbRun(
          `UPDATE files SET content = ?, updated_at = ? WHERE id = ?`,
          [updatedContent, now, sourceFile.id]
        );
        await syncFileLinks(sourceFile.id, updatedContent);

        const updated = await dbGet(`SELECT * FROM files WHERE id = ?`, [sourceFile.id]);
        syncFileToDisk(updated);
      }
    }

    res.json({ success: true, message: 'Link accepted and appended to note' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/links/:id/reject - Reject an AI suggested link
app.post('/api/links/:id/reject', async (req, res) => {
  try {
    const linkId = req.params.id;
    await dbRun(`DELETE FROM links WHERE id = ?`, [linkId]);
    res.json({ success: true, message: 'Link rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. POST /api/files/:id/suggestions/reject-all - Discard all pending AI links for this file
app.post('/api/files/:id/suggestions/reject-all', async (req, res) => {
  try {
    const fileId = req.params.id;
    await dbRun(
      `DELETE FROM links WHERE (source_file_id = ? OR target_file_id = ?) AND status = 'pending'`,
      [fileId, fileId]
    );
    res.json({ success: true, message: 'All pending AI suggestions discarded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// UNIVERSAL NOTE-SYNTHESIS SYSTEM ENDPOINTS (Raw -> Formal Companion Workflow)
// ============================================================================

// 12. POST /api/files/:id/synthesize/preview - Generate formal synthesis without mutating database
app.post('/api/files/:id/synthesize/preview', async (req, res) => {
  try {
    const rawFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!rawFile) {
      return res.status(404).json({ error: 'Source note not found' });
    }

    if (!rawFile.content || rawFile.content.trim().length === 0) {
      return res.status(400).json({ error: 'Source note content is empty. Add notes to synthesize.' });
    }

    // Retrieve all other vault titles for contextual cross-linking
    const otherNotes = await dbAll(`SELECT title FROM files WHERE id != ?`, [rawFile.id]);
    const existingTitles = otherNotes.map((n) => n.title);

    // Call Universal synthesis provider
    const aiConfig = await resolveAIConfig(req);
    const result = await synthesizeWithUniversalAI({
      rawTitle: rawFile.title,
      rawContent: rawFile.content,
      existingTitles,
      aiConfig,
    });

    // Render structured JSON into textbook-grade Markdown
    const renderedMarkdown = renderFormalMarkdown({
      rawTitle: rawFile.title,
      structuredData: result.structuredOutput,
      model: result.model,
      promptVersion: result.promptVersion,
      provider: result.provider,
    });

    // Check if active formal companion note already exists in vault
    const existingFormalNote = await dbGet(
      `SELECT id, title, path, updated_at FROM files 
       WHERE (raw_file_id = ? OR (id = ? AND ? > 0)) AND (note_type = 'formal' OR path LIKE 'process/%')
       LIMIT 1`,
      [rawFile.id, rawFile.formal_file_id || 0, rawFile.formal_file_id || 0]
    );

    res.json({
      success: true,
      rawNote: { id: rawFile.id, title: rawFile.title },
      formalTitle: result.structuredOutput.formalTitle || `${rawFile.title} (Formal)`,
      previewMarkdown: renderedMarkdown,
      structuredOutput: result.structuredOutput,
      promptVersion: result.promptVersion,
      model: result.model,
      provider: result.provider,
      existingFormalNote: existingFormalNote || null,
    });
  } catch (err) {
    console.error('Synthesis preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 13. POST /api/files/:id/synthesize/save - Persist/update formal companion note & sync graph
app.post('/api/files/:id/synthesize/save', async (req, res) => {
  try {
    const rawFileId = parseInt(req.params.id, 10);
    const rawFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [rawFileId]);
    if (!rawFile) {
      return res.status(404).json({ error: 'Source raw note not found' });
    }

    const {
      renderedMarkdown,
      structuredOutput,
      formalTitle: customTitle,
      promptVersion = CURRENT_PROMPT_VERSION,
      model = DEFAULT_GROQ_MODEL,
      overwriteConfirmed = false,
    } = req.body;

    if (!renderedMarkdown || renderedMarkdown.trim().length === 0) {
      return res.status(400).json({ error: 'Rendered markdown content is required.' });
    }

    // Determine target formal title and path inside process/ folder
    const formalTitle = (customTitle || structuredOutput?.formalTitle || `${rawFile.title} (Formal)`).trim();
    const formalPath = `process/${formalTitle}.md`;
    const now = new Date().toISOString();

    // Check if formal note already exists
    let existingFormal = await dbGet(
      `SELECT * FROM files 
       WHERE (raw_file_id = ? OR (id = ? AND ? > 0) OR (title = ? AND (note_type = 'formal' OR path LIKE 'process/%'))) 
         AND (note_type = 'formal' OR path LIKE 'process/%')
       LIMIT 1`,
      [rawFileId, rawFile.formal_file_id || 0, rawFile.formal_file_id || 0, formalTitle]
    );

    // If companion exists and user has not explicitly confirmed overwrite, prevent accidental loss
    if (existingFormal && !overwriteConfirmed) {
      return res.status(409).json({
        error: 'A formal companion note already exists for this note.',
        existingFormalNote: {
          id: existingFormal.id,
          title: existingFormal.title,
          updated_at: existingFormal.updated_at,
        },
      });
    }

    let savedFormalFileId;
    let isUpdate = false;

    if (existingFormal) {
      // Update existing formal note in process/ folder
      await dbRun(
        `UPDATE files SET title = ?, path = ?, content = ?, note_type = 'formal', raw_file_id = ?, updated_at = ? WHERE id = ?`,
        [formalTitle, formalPath, renderedMarkdown, rawFileId, now, existingFormal.id]
      );
      savedFormalFileId = existingFormal.id;
      isUpdate = true;
    } else {
      // Create new formal note record in process/ folder
      const insertResult = await dbRun(
        `INSERT INTO files (title, path, content, note_type, raw_file_id, created_at, updated_at) VALUES (?, ?, ?, 'formal', ?, ?, ?)`,
        [formalTitle, formalPath, renderedMarkdown, rawFileId, now, now]
      );
      savedFormalFileId = insertResult.lastID;
    }

    // Update raw file's formal_file_id pointer without mutating raw file content
    await dbRun(
      `UPDATE files SET formal_file_id = ? WHERE id = ?`,
      [savedFormalFileId, rawFileId]
    );

    // Compute version number for archival
    const lastVersion = await dbGet(
      `SELECT MAX(version_number) as max_v FROM synthesis_versions WHERE raw_file_id = ?`,
      [rawFileId]
    );
    const nextVersion = (lastVersion?.max_v || 0) + 1;

    // Archive version in synthesis_versions table
    const versionResult = await dbRun(
      `INSERT INTO synthesis_versions (raw_file_id, formal_file_id, version_number, prompt_version, model, raw_input, structured_output, rendered_markdown, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rawFileId,
        savedFormalFileId,
        nextVersion,
        promptVersion,
        model,
        rawFile.content,
        JSON.stringify(structuredOutput || {}),
        renderedMarkdown,
        now,
      ]
    );

    // Graph Synchronization with exponential backoff retry
    const graphSyncResult = await syncGraphWithRetry(savedFormalFileId, renderedMarkdown, 3);
    const savedFormalFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [savedFormalFileId]);

    // Sync to disk process folder
    syncFileToDisk(savedFormalFile);

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      formalFile: savedFormalFile,
      versionId: versionResult.lastID,
      versionNumber: nextVersion,
      isUpdate,
      graphSynced: graphSyncResult.success,
      graphSyncError: graphSyncResult.error || null,
      message: isUpdate ? 'Formal note updated and version archived.' : 'Formal companion note created and linked.',
    });
  } catch (err) {
    console.error('Synthesis save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 14. POST /api/files/:id/synthesize/auto - Fast one-click synthesize & persist
app.post('/api/files/:id/synthesize/auto', async (req, res) => {
  try {
    const rawFileId = parseInt(req.params.id, 10);
    const { overwriteConfirmed = false } = req.body || {};

    const rawFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [rawFileId]);
    if (!rawFile) {
      return res.status(404).json({ error: 'Source raw note not found' });
    }

    if (!rawFile.content || rawFile.content.trim().length === 0) {
      return res.status(400).json({ error: 'Note is empty. Please add note content first.' });
    }

    // Check if formal note already exists and overwrite not confirmed
    const existingFormal = await dbGet(
      `SELECT id, title, path, updated_at FROM files 
       WHERE (raw_file_id = ? OR (id = ? AND ? > 0)) AND (note_type = 'formal' OR path LIKE 'process/%')
       LIMIT 1`,
      [rawFileId, rawFile.formal_file_id || 0, rawFile.formal_file_id || 0]
    );

    if (existingFormal && !overwriteConfirmed) {
      return res.status(409).json({
        error: 'A formal note already exists. Please confirm overwrite in review mode.',
        existingFormalNote: existingFormal,
      });
    }

    const otherNotes = await dbAll(`SELECT title FROM files WHERE id != ?`, [rawFileId]);
    const existingTitles = otherNotes.map((n) => n.title);

    const aiConfig = await resolveAIConfig(req);
    const result = await synthesizeWithUniversalAI({
      rawTitle: rawFile.title,
      rawContent: rawFile.content,
      existingTitles,
      aiConfig,
    });

    const renderedMarkdown = renderFormalMarkdown({
      rawTitle: rawFile.title,
      structuredData: result.structuredOutput,
      model: result.model,
      promptVersion: result.promptVersion,
      provider: result.provider,
    });

    const formalTitle = (result.structuredOutput.formalTitle || `${rawFile.title} (Formal)`).trim();
    const formalPath = `process/${formalTitle}.md`;
    const now = new Date().toISOString();

    let savedFormalFileId;
    let isUpdate = false;

    if (existingFormal) {
      await dbRun(
        `UPDATE files SET title = ?, path = ?, content = ?, note_type = 'formal', raw_file_id = ?, updated_at = ? WHERE id = ?`,
        [formalTitle, formalPath, renderedMarkdown, rawFileId, now, existingFormal.id]
      );
      savedFormalFileId = existingFormal.id;
      isUpdate = true;
    } else {
      const insertResult = await dbRun(
        `INSERT INTO files (title, path, content, note_type, raw_file_id, created_at, updated_at) VALUES (?, ?, ?, 'formal', ?, ?, ?)`,
        [formalTitle, formalPath, renderedMarkdown, rawFileId, now, now]
      );
      savedFormalFileId = insertResult.lastID;
    }

    await dbRun(`UPDATE files SET formal_file_id = ? WHERE id = ?`, [savedFormalFileId, rawFileId]);

    const lastVersion = await dbGet(
      `SELECT MAX(version_number) as max_v FROM synthesis_versions WHERE raw_file_id = ?`,
      [rawFileId]
    );
    const nextVersion = (lastVersion?.max_v || 0) + 1;

    await dbRun(
      `INSERT INTO synthesis_versions (raw_file_id, formal_file_id, version_number, prompt_version, model, raw_input, structured_output, rendered_markdown, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rawFileId,
        savedFormalFileId,
        nextVersion,
        result.promptVersion,
        result.model,
        rawFile.content,
        JSON.stringify(result.structuredOutput),
        renderedMarkdown,
        now,
      ]
    );

    const graphSyncResult = await syncGraphWithRetry(savedFormalFileId, renderedMarkdown, 3);
    const savedFormalFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [savedFormalFileId]);

    // Sync to disk process folder
    syncFileToDisk(savedFormalFile);

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      formalFile: savedFormalFile,
      versionNumber: nextVersion,
      isUpdate,
      graphSynced: graphSyncResult.success,
      message: isUpdate ? 'Formal note regenerated & updated.' : 'Formal companion note synthesized & created!',
    });
  } catch (err) {
    console.error('Synthesis auto error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 15. GET /api/files/:id/synthesis-history - Retrieve previous synthesis versions
app.get('/api/files/:id/synthesis-history', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const versions = await dbAll(
      `SELECT sv.*, rf.title as raw_title, ff.title as formal_title
       FROM synthesis_versions sv
       LEFT JOIN files rf ON sv.raw_file_id = rf.id
       LEFT JOIN files ff ON sv.formal_file_id = ff.id
       WHERE sv.raw_file_id = ? OR sv.formal_file_id = ?
       ORDER BY sv.version_number DESC`,
      [fileId, fileId]
    );
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. POST /api/files/:id/resync-graph - Retry graph links synchronization on demand
app.post('/api/files/:id/resync-graph', async (req, res) => {
  try {
    const file = await dbGet(`SELECT * FROM files WHERE id = ?`, [req.params.id]);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    const result = await syncGraphWithRetry(file.id, file.content, 3);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 17. UNIVERSAL AI CONFIGURATION & CREDENTIALS ENDPOINTS
// ============================================================================

// GET /api/ai/config - Retrieve current AI provider configuration & catalogs
app.get('/api/ai/config', async (req, res) => {
  try {
    const dbRows = await dbAll(`SELECT key, value FROM app_settings WHERE key LIKE 'ai_%'`);
    const dbSettings = {};
    for (const row of dbRows) {
      dbSettings[row.key] = row.value;
    }

    const activeConfig = await resolveAIConfig();

    // Mask sensitive keys for client display (e.g. gsk_...83KAqI)
    const maskKey = (key) => {
      if (!key || key.length < 8) return '';
      return `${key.slice(0, 4)}...${key.slice(-4)}`;
    };

    const clientProviders = {};
    for (const [id, meta] of Object.entries(AI_PROVIDERS)) {
      const storedKey = dbSettings[`ai_key_${id}`] || (id === activeConfig.provider ? activeConfig.apiKey : '');
      const storedModel = dbSettings[`ai_model_${id}`] || (id === activeConfig.provider ? activeConfig.model : meta.defaultModel);
      const storedBaseUrl = dbSettings[`ai_base_url_${id}`] || (id === activeConfig.provider ? activeConfig.baseUrl : meta.endpoint);

      clientProviders[id] = {
        ...meta,
        hasKey: Boolean(storedKey && storedKey.trim() !== '' && !storedKey.startsWith('your_')),
        maskedKey: maskKey(storedKey),
        activeModel: storedModel || meta.defaultModel,
        baseUrl: storedBaseUrl || meta.endpoint,
      };
    }

    res.json({
      activeProvider: activeConfig.provider,
      activeModel: activeConfig.model,
      providers: clientProviders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/config - Save AI provider settings & keys
app.post('/api/ai/config', async (req, res) => {
  try {
    const { activeProvider, keys = {}, models = {}, baseUrls = {} } = req.body;
    const now = new Date().toISOString();

    if (activeProvider) {
      await dbRun(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ('ai_active_provider', ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [activeProvider, now]
      );
    }

    for (const [pId, keyVal] of Object.entries(keys)) {
      if (typeof keyVal === 'string' && keyVal.trim() !== '') {
        await dbRun(
          `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [`ai_key_${pId}`, keyVal.trim(), now]
        );
      }
    }

    for (const [pId, modelVal] of Object.entries(models)) {
      if (typeof modelVal === 'string' && modelVal.trim() !== '') {
        await dbRun(
          `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [`ai_model_${pId}`, modelVal.trim(), now]
        );
      }
    }

    for (const [pId, urlVal] of Object.entries(baseUrls)) {
      if (typeof urlVal === 'string' && urlVal.trim() !== '') {
        await dbRun(
          `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
          [`ai_base_url_${pId}`, urlVal.trim(), now]
        );
      }
    }

    res.json({ success: true, message: 'AI configuration saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/test - Test connection with specified or active provider
app.post('/api/ai/test', async (req, res) => {
  try {
    let { provider, apiKey, model, baseUrl } = req.body || {};

    if (!provider || !apiKey) {
      const resolved = await resolveAIConfig(req);
      provider = provider || resolved.provider;
      apiKey = apiKey || resolved.apiKey;
      model = model || resolved.model;
      baseUrl = baseUrl || resolved.baseUrl;
    }

    const result = await testAIConnection({ provider, apiKey, model, baseUrl });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, dbAll, dbGet, dbRun } from './db.js';
import { syncFileLinks } from './parser.js';
import { processFileWithAI } from './ai.js';
import { seedDatabase } from './seed.js';
import {
  GroqSynthesisProvider,
  renderFormalMarkdown,
  syncGraphWithRetry,
  CURRENT_PROMPT_VERSION,
  DEFAULT_GROQ_MODEL,
} from './synthesisService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB and Seed Data
await initDb();
await seedDatabase();

// 1. GET /api/files - List all files with companion metadata
app.get('/api/files', async (req, res) => {
  try {
    const files = await dbAll(
      `SELECT id, title, path, note_type, raw_file_id, formal_file_id, created_at, updated_at FROM files ORDER BY title ASC`
    );
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/files - Create a file
app.post('/api/files', async (req, res) => {
  try {
    const { title, content, path: filePath, note_type = 'raw', raw_file_id = null } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    let cleanTitle = title.trim();
    let finalPath = filePath || `${cleanTitle}.md`;
    let counter = 1;
    while (await dbGet(`SELECT id FROM files WHERE path = ?`, [finalPath])) {
      finalPath = `${cleanTitle} ${counter}.md`;
      counter++;
    }
    if (counter > 1) {
      cleanTitle = `${cleanTitle} ${counter - 1}`;
    }
    const finalContent = content || `# ${cleanTitle}\n\nStart writing notes here...`;
    const now = new Date().toISOString();

    const result = await dbRun(
      `INSERT INTO files (title, path, content, note_type, raw_file_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanTitle, finalPath, finalContent, note_type, raw_file_id, now, now]
    );

    const fileId = result.lastID;
    await syncFileLinks(fileId, finalContent);

    const createdFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
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
      [file.id]
    );

    // Resolve companion note if linked
    let companionNote = null;
    if (file.formal_file_id) {
      companionNote = await dbGet(`SELECT id, title, path, updated_at FROM files WHERE id = ?`, [file.formal_file_id]);
    } else if (file.raw_file_id) {
      companionNote = await dbGet(`SELECT id, title, path, updated_at FROM files WHERE id = ?`, [file.raw_file_id]);
    } else if (file.note_type !== 'formal') {
      // Fallback check if formal note exists by raw_file_id match or title suffix
      const potential = await dbGet(
        `SELECT id, title, path, updated_at FROM files WHERE raw_file_id = ? OR title = ? LIMIT 1`,
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

// 4. PUT /api/files/:id - Update file content
app.put('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { title, content } = req.body;
    const existing = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
    if (!existing) {
      return res.status(404).json({ error: 'File not found' });
    }

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newContent = content !== undefined ? content : existing.content;
    const newPath = `${newTitle}.md`;
    const now = new Date().toISOString();

    await dbRun(
      `UPDATE files SET title = ?, path = ?, content = ?, updated_at = ? WHERE id = ?`,
      [newTitle, newPath, newContent, now, fileId]
    );

    await syncFileLinks(fileId, newContent);

    const updatedFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
    res.json(updatedFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/files/:id - Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    await dbRun(`DELETE FROM files WHERE id = ?`, [fileId]);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/files/:id/backlinks - Get incoming backlinks
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
       WHERE (l.target_file_id = ? OR LOWER(l.target_title) = LOWER(?))
       ORDER BY l.status DESC, l.created_at DESC`,
      [targetFile.id, targetFile.title]
    );

    res.json(backlinks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/files/:id/graph - Get 1-hop neighborhood graph
app.get('/api/files/:id/graph', async (req, res) => {
  try {
    const centerId = parseInt(req.params.id, 10);
    const centerFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [centerId]);
    if (!centerFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Outgoing links (source = centerId)
    const outgoing = await dbAll(
      `SELECT l.*, f.title as resolved_target_title
       FROM links l
       LEFT JOIN files f ON l.target_file_id = f.id
       WHERE l.source_file_id = ?`,
      [centerId]
    );

    // Incoming links (target = centerId OR target_title = centerFile.title)
    const incoming = await dbAll(
      `SELECT l.*, f.title as source_file_title
       FROM links l
       JOIN files f ON l.source_file_id = f.id
       WHERE l.target_file_id = ? OR LOWER(l.target_title) = LOWER(?)`,
      [centerId, centerFile.title]
    );

    const nodesMap = new Map();
    nodesMap.set(centerFile.id, {
      id: centerFile.id,
      title: centerFile.title,
      isCenter: true,
    });

    const edges = [];

    // Add outgoing edges and target nodes
    for (const link of outgoing) {
      let targetId = link.target_file_id;

      // If target file doesn't exist in DB yet, create a synthetic node ID
      if (!targetId) {
        targetId = `unresolved_${link.target_title}`;
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            title: link.target_title,
            isUnresolved: true,
          });
        }
      } else {
        if (!nodesMap.has(targetId)) {
          const tFile = await dbGet(`SELECT id, title FROM files WHERE id = ?`, [targetId]);
          if (tFile) {
            nodesMap.set(tFile.id, {
              id: tFile.id,
              title: tFile.title,
              isCenter: false,
            });
          }
        }
      }

      edges.push({
        id: link.id,
        source: centerId,
        target: targetId,
        relationship: link.relationship,
        context: link.context,
        status: link.status,
        is_ai_suggested: link.is_ai_suggested,
      });
    }

    // Add incoming edges and source nodes
    for (const link of incoming) {
      if (!nodesMap.has(link.source_file_id)) {
        nodesMap.set(link.source_file_id, {
          id: link.source_file_id,
          title: link.source_file_title,
          isCenter: false,
        });
      }

      // Avoid adding duplicate edges if already present
      if (!edges.some((e) => e.id === link.id)) {
        edges.push({
          id: link.id,
          source: link.source_file_id,
          target: centerId,
          relationship: link.relationship,
          context: link.context,
          status: link.status,
          is_ai_suggested: link.is_ai_suggested,
        });
      }
    }

    const depth = parseInt(req.query.depth || '1', 10);
    if (depth >= 2) {
      const hop1FileIds = Array.from(nodesMap.keys()).filter((k) => typeof k === 'number' && k !== centerId);
      if (hop1FileIds.length > 0) {
        const placeholders = hop1FileIds.map(() => '?').join(',');
        const hop2Links = await dbAll(
          `SELECT l.*, f1.title as source_title, f2.title as resolved_target_title
           FROM links l
           JOIN files f1 ON l.source_file_id = f1.id
           LEFT JOIN files f2 ON l.target_file_id = f2.id
           WHERE (l.source_file_id IN (${placeholders}) OR l.target_file_id IN (${placeholders}))
           AND (l.status = 'accepted' OR l.is_ai_suggested = 1)`,
          [...hop1FileIds, ...hop1FileIds]
        );

        for (const link of hop2Links) {
          let sId = link.source_file_id;
          let tId = link.target_file_id;
          if (!tId) {
            tId = `unresolved_${link.target_title}`;
            if (!nodesMap.has(tId)) {
              nodesMap.set(tId, {
                id: tId,
                title: link.target_title,
                isUnresolved: true,
                isHop2: true,
              });
            }
          } else if (!nodesMap.has(tId)) {
            nodesMap.set(tId, {
              id: tId,
              title: link.resolved_target_title || link.target_title,
              isHop2: true,
            });
          }

          if (!nodesMap.has(sId)) {
            nodesMap.set(sId, {
              id: sId,
              title: link.source_title,
              isHop2: true,
            });
          }

          if (!edges.some((e) => e.id === link.id)) {
            edges.push({
              id: link.id,
              source: sId,
              target: tId,
              relationship: link.relationship,
              context: link.context,
              status: link.status,
              is_ai_suggested: link.is_ai_suggested,
            });
          }
        }
      }
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

// 7b. GET /api/graph - Get full global vault graph
app.get('/api/graph', async (req, res) => {
  try {
    const allFiles = await dbAll(`SELECT id, title, path FROM files ORDER BY title ASC`);
    const allLinks = await dbAll(`
      SELECT l.*, f1.title as source_title, f2.title as resolved_target_title
      FROM links l
      JOIN files f1 ON l.source_file_id = f1.id
      LEFT JOIN files f2 ON l.target_file_id = f2.id
      WHERE l.status = 'accepted' OR l.is_ai_suggested = 1
    `);

    const nodesMap = new Map();
    // Add all vault files as nodes so even disconnected files are visible in global clusters
    for (const f of allFiles) {
      nodesMap.set(f.id, {
        id: f.id,
        title: f.title,
        path: f.path,
        isCenter: false,
        degree: 0,
      });
    }

    const edges = [];
    for (const l of allLinks) {
      let targetId = l.target_file_id;
      if (!targetId) {
        targetId = `unresolved_${l.target_title}`;
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            title: l.target_title,
            isUnresolved: true,
            degree: 0,
          });
        }
      }

      // Update degrees
      if (nodesMap.has(l.source_file_id)) {
        nodesMap.get(l.source_file_id).degree += 1;
      }
      if (nodesMap.has(targetId)) {
        nodesMap.get(targetId).degree += 1;
      }

      edges.push({
        id: l.id,
        source: l.source_file_id,
        target: targetId,
        relationship: l.relationship,
        context: l.context,
        status: l.status,
        is_ai_suggested: l.is_ai_suggested,
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

// 8. POST /api/files/:id/process - AI Link Suggestion
app.post('/api/files/:id/process', async (req, res) => {
  try {
    const fileId = req.params.id;
    const suggestions = await processFileWithAI(fileId);
    res.json({ success: true, suggestions });
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
// GROQ NOTE-SYNTHESIS SYSTEM ENDPOINTS (Raw -> Formal Companion Workflow)
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

    // Call Groq synthesis provider (abstracted service)
    const provider = new GroqSynthesisProvider();
    const result = await provider.synthesize({
      rawTitle: rawFile.title,
      rawContent: rawFile.content,
      existingTitles,
    });

    // Render structured JSON into textbook-grade Markdown
    const renderedMarkdown = renderFormalMarkdown({
      rawTitle: rawFile.title,
      structuredData: result.structuredOutput,
      model: result.model,
      promptVersion: result.promptVersion,
    });

    // Check if formal note already exists for this raw note
    const existingFormalNote = await dbGet(
      `SELECT id, title, path, updated_at FROM files WHERE raw_file_id = ? OR id = ? OR title = ? LIMIT 1`,
      [rawFile.id, rawFile.formal_file_id || 0, `${rawFile.title} (Formal)`]
    );

    res.json({
      success: true,
      rawNote: { id: rawFile.id, title: rawFile.title },
      formalTitle: result.structuredOutput.formalTitle || `${rawFile.title} (Formal)`,
      previewMarkdown: renderedMarkdown,
      structuredOutput: result.structuredOutput,
      promptVersion: result.promptVersion,
      model: result.model,
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

    // Determine target formal title
    const formalTitle = (customTitle || structuredOutput?.formalTitle || `${rawFile.title} (Formal)`).trim();
    const formalPath = `${formalTitle}.md`;
    const now = new Date().toISOString();

    // Check if formal note already exists
    let existingFormal = await dbGet(
      `SELECT * FROM files WHERE raw_file_id = ? OR id = ? OR title = ? LIMIT 1`,
      [rawFileId, rawFile.formal_file_id || 0, formalTitle]
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
      // Update existing formal note (RAW NOTE CONTENT REMAINS COMPLETELY UNTOUCHED)
      await dbRun(
        `UPDATE files SET title = ?, path = ?, content = ?, note_type = 'formal', raw_file_id = ?, updated_at = ? WHERE id = ?`,
        [formalTitle, formalPath, renderedMarkdown, rawFileId, now, existingFormal.id]
      );
      savedFormalFileId = existingFormal.id;
      isUpdate = true;
    } else {
      // Create new formal note record (RAW NOTE CONTENT REMAINS COMPLETELY UNTOUCHED)
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
      `SELECT id, title, path, updated_at FROM files WHERE raw_file_id = ? OR id = ? OR title = ? LIMIT 1`,
      [rawFileId, rawFile.formal_file_id || 0, `${rawFile.title} (Formal)`]
    );

    if (existingFormal && !overwriteConfirmed) {
      return res.status(409).json({
        error: 'A formal note already exists. Please confirm overwrite in review mode.',
        existingFormalNote: existingFormal,
      });
    }

    const otherNotes = await dbAll(`SELECT title FROM files WHERE id != ?`, [rawFileId]);
    const existingTitles = otherNotes.map((n) => n.title);

    const provider = new GroqSynthesisProvider();
    const result = await provider.synthesize({
      rawTitle: rawFile.title,
      rawContent: rawFile.content,
      existingTitles,
    });

    const renderedMarkdown = renderFormalMarkdown({
      rawTitle: rawFile.title,
      structuredData: result.structuredOutput,
      model: result.model,
      promptVersion: result.promptVersion,
    });

    const formalTitle = (result.structuredOutput.formalTitle || `${rawFile.title} (Formal)`).trim();
    const formalPath = `${formalTitle}.md`;
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

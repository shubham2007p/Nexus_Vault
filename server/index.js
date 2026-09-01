import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, dbAll, dbGet, dbRun } from './db.js';
import { syncFileLinks } from './parser.js';
import { processFileWithAI } from './ai.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize DB and Seed Data
await initDb();
await seedDatabase();

// 1. GET /api/files - List all files
app.get('/api/files', async (req, res) => {
  try {
    const files = await dbAll(
      `SELECT id, title, path, created_at, updated_at FROM files ORDER BY title ASC`
    );
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/files - Create a file
app.post('/api/files', async (req, res) => {
  try {
    const { title, content, path: filePath } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const cleanTitle = title.trim();
    const finalPath = filePath || `${cleanTitle}.md`;
    const finalContent = content || `# ${cleanTitle}\n\nStart writing notes here...`;
    const now = new Date().toISOString();

    const result = await dbRun(
      `INSERT INTO files (title, path, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [cleanTitle, finalPath, finalContent, now, now]
    );

    const fileId = result.lastID;
    await syncFileLinks(fileId, finalContent);

    const createdFile = await dbGet(`SELECT * FROM files WHERE id = ?`, [fileId]);
    res.status(201).json(createdFile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/files/:id - Get single file
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
    res.json({ ...file, links });
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

    res.json({
      nodes: Array.from(nodesMap.values()),
      edges,
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

import { dbAll, dbRun, dbGet } from './db.js';

export function parseLinks(content) {
  if (!content) return [];
  const LINK_PATTERN = /\[\[([^\[\]]+)\]\]/g;
  const links = [];
  let match;

  while ((match = LINK_PATTERN.exec(content)) !== null) {
    const rawInner = match[1].trim();
    const parts = rawInner.split('|').map((p) => p.trim());

    let target_title = '';
    let relationship = null;
    let context = null;

    if (parts.length === 3) {
      target_title = parts[0];
      relationship = parts[1];
      context = parts[2];
    } else {
      target_title = parts[0];
    }

    if (target_title) {
      links.push({
        target_title,
        relationship,
        context,
        rawText: match[0],
      });
    }
  }

  return links;
}

export async function syncFileLinks(sourceFileId, content) {
  const extractedLinks = parseLinks(content);
  const now = new Date().toISOString();

  // Get all existing files to map titles -> file ids
  const allFiles = await dbAll(`SELECT id, title FROM files`);
  const fileTitleMap = new Map();
  allFiles.forEach((f) => {
    fileTitleMap.set(f.title.toLowerCase(), f.id);
  });

  // Get current links in database for this source file
  const existingLinks = await dbAll(
    `SELECT * FROM links WHERE source_file_id = ?`,
    [sourceFileId]
  );

  // We keep track of which existing accepted links match the extracted links
  const extractedSignatures = new Set();
  
  for (const link of extractedLinks) {
    const targetFileId = fileTitleMap.get(link.target_title.toLowerCase()) || null;
    const sig = `${link.target_title.toLowerCase()}|${link.relationship || ''}|${link.context || ''}`;
    extractedSignatures.add(sig);

    // Check if this accepted link already exists
    const matchRow = existingLinks.find((row) => {
      const rowSig = `${row.target_title.toLowerCase()}|${row.relationship || ''}|${row.context || ''}`;
      return rowSig === sig && row.status === 'accepted';
    });

    if (!matchRow) {
      // Check if there was a pending AI link for this exact target that user converted
      const pendingMatch = existingLinks.find(
        (row) => row.target_title.toLowerCase() === link.target_title.toLowerCase() && row.status === 'pending'
      );

      if (pendingMatch) {
        await dbRun(
          `UPDATE links SET target_file_id = ?, relationship = ?, context = ?, status = 'accepted', is_ai_suggested = 0 WHERE id = ?`,
          [targetFileId, link.relationship, link.context, pendingMatch.id]
        );
      } else {
        await dbRun(
          `INSERT INTO links (source_file_id, target_file_id, target_title, relationship, context, is_ai_suggested, status, created_at)
           VALUES (?, ?, ?, ?, ?, 0, 'accepted', ?)`,
          [sourceFileId, targetFileId, link.target_title, link.relationship, link.context, now]
        );
      }
    } else {
      // Update target_file_id if target file was newly created
      if (matchRow.target_file_id !== targetFileId) {
        await dbRun(`UPDATE links SET target_file_id = ? WHERE id = ?`, [targetFileId, matchRow.id]);
      }
    }
  }

  // Remove accepted links that are no longer in the markdown content
  for (const row of existingLinks) {
    if (row.status === 'accepted') {
      const rowSig = `${row.target_title.toLowerCase()}|${row.relationship || ''}|${row.context || ''}`;
      if (!extractedSignatures.has(rowSig)) {
        await dbRun(`DELETE FROM links WHERE id = ?`, [row.id]);
      }
    }
  }
}

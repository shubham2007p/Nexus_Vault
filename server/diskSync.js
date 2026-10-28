import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAll } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const RAW_DIR = path.join(rootDir, 'raw');
export const PROCESS_DIR = path.join(rootDir, 'process');

// Ensure directories exist
export function initDiskFolders() {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROCESS_DIR)) {
    fs.mkdirSync(PROCESS_DIR, { recursive: true });
  }
}

/**
 * Sanitize file name for Windows / macOS / Linux file systems.
 */
export function sanitizeFileName(name) {
  if (!name) return 'Untitled';
  return name
    .replace(/[<>:"/\\|?*]/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sync a single file to the appropriate folder ('raw' or 'process') on disk.
 */
export function syncFileToDisk(file) {
  if (!file || !file.title) return;
  initDiskFolders();

  const isFormal = file.note_type === 'formal' || (file.title && file.title.includes('(Formal)'));
  const targetDir = isFormal ? PROCESS_DIR : RAW_DIR;
  const safeName = `${sanitizeFileName(file.title)}.md`;
  const fullPath = path.join(targetDir, safeName);

  try {
    fs.writeFileSync(fullPath, file.content || '', 'utf8');
  } catch (err) {
    console.warn(`Failed to sync file to disk [${safeName}]:`, err.message);
  }
}

/**
 * Delete a file from disk ('raw' or 'process').
 */
export function deleteFileFromDisk(file) {
  if (!file || !file.title) return;
  const safeName = `${sanitizeFileName(file.title)}.md`;

  const rawPath = path.join(RAW_DIR, safeName);
  const processPath = path.join(PROCESS_DIR, safeName);

  try {
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
    if (fs.existsSync(processPath)) fs.unlinkSync(processPath);
  } catch (err) {
    console.warn(`Failed to delete file from disk [${safeName}]:`, err.message);
  }
}

/**
 * Sync all files from SQLite database to disk into raw and process folders.
 */
export async function syncAllFilesToDisk() {
  initDiskFolders();
  const allFiles = await dbAll('SELECT * FROM files');

  for (const file of allFiles) {
    syncFileToDisk(file);
  }

  const rawCount = fs.existsSync(RAW_DIR) ? fs.readdirSync(RAW_DIR).length : 0;
  const processCount = fs.existsSync(PROCESS_DIR) ? fs.readdirSync(PROCESS_DIR).length : 0;
  console.log(`Disk sync complete. Raw folder: ${rawCount} files, Process folder: ${processCount} files.`);
}


import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CACHE_DIR = path.resolve(__dirname, '../data/cache');
export const RAW_DIR = path.resolve(__dirname, '../data/raw');
export const DEMO_DIR = path.resolve(__dirname, '../data/demo');
export const PROCESSED_DIR = path.resolve(__dirname, '../data/processed');

// Ensure all distinct data directories exist
[CACHE_DIR, RAW_DIR, DEMO_DIR, PROCESSED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export function computeSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function saveToCache<T>(key: string, data: T): { filePath: string; sha256: string; timestamp: string } {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  const serialized = JSON.stringify(data, null, 2);
  const sha256 = computeSha256(serialized);
  fs.writeFileSync(filePath, serialized, 'utf-8');
  const timestamp = new Date().toISOString();
  return { filePath, sha256, timestamp };
}

export function loadFromCache<T>(key: string): { data: T; sha256: string; timestamp: string } | null {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const sha256 = computeSha256(raw);
    const stat = fs.statSync(filePath);
    const data = JSON.parse(raw) as T;
    return { data, sha256, timestamp: stat.mtime.toISOString() };
  } catch (err) {
    console.error(`Failed to load cache for key ${key}:`, err);
    return null;
  }
}

export function hasValidCache(key: string, maxAgeHours: number = 72): boolean {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) return false;
  try {
    const stat = fs.statSync(filePath);
    const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    return ageHours < maxAgeHours;
  } catch {
    return false;
  }
}

export function getCacheInfo(key: string): { exists: boolean; filePath: string; sizeBytes?: number; mtime?: string } {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) {
    return { exists: false, filePath };
  }
  const stat = fs.statSync(filePath);
  return {
    exists: true,
    filePath,
    sizeBytes: stat.size,
    mtime: stat.mtime.toISOString()
  };
}

// ==========================================
// DEMONSTRATION FIXTURES STORAGE
// ==========================================
export function saveDemoFile(filename: string, content: string | Buffer): { filePath: string; sha256: string } {
  const filePath = path.join(DEMO_DIR, filename);
  fs.writeFileSync(filePath, content);
  const sha256 = computeSha256(content);
  return { filePath, sha256 };
}

export function readDemoFile(filename: string): { content: string; sha256: string } | null {
  const filePath = path.join(DEMO_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return { content, sha256: computeSha256(content) };
}

// ==========================================
// GENUINE RAW SATELLITE DOWNLOADS STORAGE
// ==========================================
export function saveRawFile(filename: string, content: string | Buffer): { filePath: string; sha256: string } {
  const filePath = path.join(RAW_DIR, filename);
  fs.writeFileSync(filePath, content);
  const sha256 = computeSha256(content);
  return { filePath, sha256 };
}

export function readRawFile(filename: string): { content: string; sha256: string } | null {
  const filePath = path.join(RAW_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return { content, sha256: computeSha256(content) };
}

// ==========================================
// GENUINE SCIENTIFIC PROCESSED DATASETS
// ==========================================
export function saveProcessedFile(filename: string, content: string | Buffer): { filePath: string; sha256: string } {
  const filePath = path.join(PROCESSED_DIR, filename);
  fs.writeFileSync(filePath, content);
  const sha256 = computeSha256(content);
  return { filePath, sha256 };
}

export function readProcessedFile(filename: string): { content: string; sha256: string } | null {
  const filePath = path.join(PROCESSED_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return { content, sha256: computeSha256(content) };
}

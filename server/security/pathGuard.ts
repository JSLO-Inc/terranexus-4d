/**
 * TERRANEXUS 4D — Path Traversal Protection & Safe File Handler
 * 
 * Guards against directory traversal attacks (e.g. `../../etc/passwd`, `..\..\Windows\System32`),
 * unsafe filename injection, symlink redirection attacks, and unauthorized file access on server disk storage.
 */

import path from 'path';
import fs from 'fs';

// Whitelist of permitted file extensions for scientific datasets
const PERMITTED_EXTENSIONS = new Set([
  '.nc',
  '.nc4',
  '.json',
  '.csv',
  '.txt',
  '.geojson',
  '.tiff',
  '.tif'
]);

export interface PathValidationOptions {
  allowedExtensions?: Set<string>;
  rejectSymlinks?: boolean;
  disallowOverwrite?: boolean;
}

export interface PathValidationResult {
  isValid: boolean;
  sanitizedFilename?: string;
  safeAbsolutePath?: string;
  error?: string;
  isExistingFile?: boolean;
}

/**
 * Validates and sanitizes a filename intended to be saved or read within a specific directory.
 * Ensures the resolved path cannot escape the target root directory and prevents symlink exploits.
 */
export function validateAndSanitizeFilename(
  rawFilename: string,
  targetDirectory: string,
  optionsOrExtensions: Set<string> | PathValidationOptions = PERMITTED_EXTENSIONS
): PathValidationResult {
  const options: PathValidationOptions = optionsOrExtensions instanceof Set
    ? { allowedExtensions: optionsOrExtensions }
    : optionsOrExtensions;

  const allowedExtensions = options.allowedExtensions ?? PERMITTED_EXTENSIONS;
  const rejectSymlinks = options.rejectSymlinks ?? true;
  const disallowOverwrite = options.disallowOverwrite ?? false;

  if (!rawFilename || typeof rawFilename !== 'string') {
    return { isValid: false, error: 'Filename must be a non-empty string.' };
  }

  // Strip leading/trailing whitespace
  const trimmed = rawFilename.trim();

  // Basic length limit
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Filename exceeds maximum length of 255 characters.' };
  }

  // Reject path separators and traversal patterns directly in filename
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return {
      isValid: false,
      error: 'Filename contains forbidden path separators or parent traversal tokens (../).'
    };
  }

  // Reject control characters or null bytes
  if (/[\x00-\x1f\x80-\x9f<>"|?*]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Filename contains invalid or dangerous control characters.'
    };
  }

  // Check file extension
  const ext = path.extname(trimmed).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return {
      isValid: false,
      error: `File extension "${ext}" is not permitted. Allowed: ${Array.from(allowedExtensions).join(', ')}`
    };
  }

  // Resolve absolute path and verify boundary
  const resolvedTargetDir = path.resolve(targetDirectory);
  const resolvedFilePath = path.resolve(resolvedTargetDir, trimmed);

  // Verification 1: The resolved path must strictly start with the resolved target directory + separator
  if (!resolvedFilePath.startsWith(resolvedTargetDir + path.sep) && resolvedFilePath !== resolvedTargetDir) {
    return {
      isValid: false,
      error: 'Path resolution escaped the designated storage root.'
    };
  }

  // Verification 2: Symlink detection
  let fileExists = false;
  try {
    const stat = fs.lstatSync(resolvedFilePath);
    fileExists = true;
    if (rejectSymlinks && stat.isSymbolicLink()) {
      return {
        isValid: false,
        error: 'Target file is a symbolic link (Symlink traversal protection).'
      };
    }
  } catch {
    // File does not exist yet (normal for write operations)
  }

  // Verification 3: Overwrite protection check
  if (disallowOverwrite && fileExists) {
    return {
      isValid: false,
      error: `Target file "${trimmed}" already exists and overwrite is disallowed.`
    };
  }

  return {
    isValid: true,
    sanitizedFilename: trimmed,
    safeAbsolutePath: resolvedFilePath,
    isExistingFile: fileExists
  };
}

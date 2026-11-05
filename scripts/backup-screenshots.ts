/**
 * TERRANEXUS 4D — Automated Screenshot Backup & GitHub Link Generator
 * 
 * Target directories:
 * - docs/screenshots/
 * - docs/ (any image files .png, .jpg, .jpeg, .webp, .svg, .gif)
 * 
 * Operations:
 * 1. Discovers newly added/modified screenshots
 * 2. Safely stages ONLY the screenshot files without affecting other working tree files
 * 3. Commits and pushes to origin/main on GitHub
 * 4. Outputs direct clickable GitHub links (Tree view, Blob view, and Raw CDN view)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO_OWNER = 'JSLO-Inc';
const REPO_NAME = 'terranexus-4d';
const BRANCH = 'main';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs', 'screenshots');
const DOCS_DIR = path.resolve(process.cwd(), 'docs');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp']);

function getScreenshotFiles(): string[] {
  const files: string[] = [];

  if (fs.existsSync(SCREENSHOT_DIR)) {
    const list = fs.readdirSync(SCREENSHOT_DIR);
    for (const f of list) {
      if (f === '.gitkeep') continue;
      const fullPath = path.join(SCREENSHOT_DIR, f);
      if (fs.statSync(fullPath).isFile()) {
        files.push(path.join('docs', 'screenshots', f));
      }
    }
  }

  // Also check docs root for loose image files
  if (fs.existsSync(DOCS_DIR)) {
    const list = fs.readdirSync(DOCS_DIR);
    for (const f of list) {
      const ext = path.extname(f).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        const fullPath = path.join(DOCS_DIR, f);
        if (fs.statSync(fullPath).isFile()) {
          files.push(path.join('docs', f));
        }
      }
    }
  }

  return files;
}

export async function backupScreenshots(): Promise<{
  success: boolean;
  pushed: boolean;
  folderUrl: string;
  files: Array<{ name: string; localPath: string; webUrl: string; rawUrl: string }>;
  message: string;
}> {
  console.log('='.repeat(75));
  console.log('TERRANEXUS 4D — SCREENSHOT BACKUP ENGINE (GITHUB)');
  console.log('='.repeat(75));

  // 1. Ensure directory exists with .gitkeep
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  const gitkeepPath = path.join(SCREENSHOT_DIR, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Screenshots directory\n', 'utf8');
  }

  const existingScreenshots = getScreenshotFiles();
  const folderUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${BRANCH}/docs/screenshots`;

  // 2. Stage specifically docs/screenshots and any images in docs
  try {
    execSync('git add docs/screenshots/', { stdio: 'pipe' });
    if (fs.existsSync(DOCS_DIR)) {
      const docsImages = fs.readdirSync(DOCS_DIR).filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
      for (const img of docsImages) {
        execSync(`git add "docs/${img}"`, { stdio: 'pipe' });
      }
    }
  } catch (err: any) {
    console.error('Error staging screenshots:', err?.message || err);
    return {
      success: false,
      pushed: false,
      folderUrl,
      files: [],
      message: `Failed to stage screenshots: ${err?.message || err}`
    };
  }

  // 3. Check if anything in docs/screenshots is staged
  let statusOutput = '';
  try {
    statusOutput = execSync('git status --porcelain docs/screenshots docs/*.png docs/*.jpg docs/*.jpeg docs/*.webp docs/*.svg docs/*.gif 2>nul', {
      encoding: 'utf8'
    }).trim();
  } catch {
    // If glob returns no match, query docs/ directly
    try {
      statusOutput = execSync('git status --porcelain docs/screenshots', { encoding: 'utf8' }).trim();
    } catch {
      statusOutput = '';
    }
  }

  let pushed = false;
  if (statusOutput.length > 0) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[Git] Staging changes detected in docs/screenshots:`);
    console.log(statusOutput);

    try {
      execSync(`git commit -m "docs(screenshots): backup screenshots [${timestamp}]"`, { stdio: 'pipe' });
      console.log(`[Git] Created commit: docs(screenshots): backup screenshots [${timestamp}]`);

      console.log(`[Git] Pushing to origin ${BRANCH}...`);
      execSync(`git push origin ${BRANCH}`, { stdio: 'inherit' });
      console.log(`[Git] Push succeeded!`);
      pushed = true;
    } catch (err: any) {
      console.error('[Git] Error during commit or push:', err?.message || err);
      return {
        success: false,
        pushed: false,
        folderUrl,
        files: [],
        message: `Commit/Push error: ${err?.message || err}`
      };
    }
  } else {
    console.log('[Git] No new or modified screenshots to commit. Everything in docs/screenshots is already synchronized with GitHub.');
  }

  // 4. Build output file list and URLs
  const allScreenshots = getScreenshotFiles();
  const fileDetails = allScreenshots.map(relPath => {
    const normalized = relPath.replace(/\\/g, '/');
    const filename = path.basename(relPath);
    return {
      name: filename,
      localPath: path.resolve(process.cwd(), relPath),
      webUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${BRANCH}/${normalized}`,
      rawUrl: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${normalized}`
    };
  });

  console.log('\n' + '-'.repeat(75));
  console.log(`📁 GitHub Folder: ${folderUrl}`);
  if (fileDetails.length > 0) {
    console.log(`🖼️  Backed Up Files (${fileDetails.length}):`);
    fileDetails.forEach((f, idx) => {
      console.log(`  [${idx + 1}] ${f.name}`);
      console.log(`      View: ${f.webUrl}`);
      console.log(`      Raw:  ${f.rawUrl}`);
    });
  } else {
    console.log('ℹ️  Folder is initialized on GitHub. Drop image files (.png, .jpg, etc.) into:');
    console.log(`   ${SCREENSHOT_DIR}`);
    console.log('   and run "npm run bkp:screenshots" or type "bkp screenshots" to push them anytime.');
  }
  console.log('-'.repeat(75) + '\n');

  return {
    success: true,
    pushed,
    folderUrl,
    files: fileDetails,
    message: pushed ? 'Successfully backed up new screenshots to GitHub!' : 'Screenshots directory synchronized with GitHub.'
  };
}

if (process.argv[1] && process.argv[1].endsWith('backup-screenshots.ts')) {
  backupScreenshots().catch(err => {
    console.error('Fatal backup error:', err);
    process.exit(1);
  });
}

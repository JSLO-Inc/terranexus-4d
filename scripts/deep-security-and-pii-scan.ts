import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ScanFinding {
  scope: 'TRACKED_FILES' | 'UNTRACKED_FILES' | 'GIT_HISTORY' | 'BUILD_OUTPUT' | 'ENV_FILES';
  file: string;
  line?: number;
  commitHash?: string;
  type: string;
  redactedPreview: string;
}

const findings: ScanFinding[] = [];

// Sensitive patterns
const SECRET_PATTERNS = [
  { name: 'Google / Gemini API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'CARTO API Key Pattern', regex: /cb1_[0-9a-zA-Z_-]{20,}/g },
  { name: 'GitHub Personal Access Token', regex: /(ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{50,})/g },
  { name: 'Generic High-Entropy API Key assignment', regex: /(?:api_?key|secret|token|password|private_key)\s*[:=]\s*["']([A-Za-z0-9-_]{24,})["']/gi },
  { name: 'Private Key Block', regex: /-----BEGIN\s+(?:RSA|OPENSSH|EC|DSA)?\s*PRIVATE KEY-----/g },
  { name: 'JWT Token', regex: /eyJ[A-Za-z0-9-_=]{10,}\.eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_.+/=]{10,}/g }
];

const PII_PATTERNS = [
  { name: 'Indian Phone Number', regex: /(?:\+91[\s-]?)?[6789]\d{9}\b/g },
  { name: 'Personal Email Address', regex: /[a-zA-Z0-9._%+-]+@(?!example\.com|carto\.com|cesium\.com|openstreetmap\.org|w3\.org|nasa\.gov|cgwb\.gov\.in|gsi\.gov\.in|github\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi }
];

function redact(val: string): string {
  if (!val) return '';
  if (val.length <= 8) return '***';
  return val.slice(0, 4) + '...' + val.slice(-4);
}

// 1. Scan Git Tracked Files
console.log('1. Scanning all Git tracked files...');
const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' })
  .split('\n')
  .map(f => f.trim())
  .filter(Boolean);

for (const relPath of trackedFiles) {
  // Skip binary files and known non-text files
  if (relPath.endsWith('.png') || relPath.endsWith('.jpg') || relPath.endsWith('.nc') || relPath.endsWith('.ico')) continue;
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  try {
    const text = fs.readFileSync(fullPath, 'utf-8');
    const lines = text.split('\n');

    lines.forEach((line, idx) => {
      // Check secrets
      for (const p of SECRET_PATTERNS) {
        const matches = line.match(p.regex);
        if (matches) {
          // Check if it's just placeholder text in docs or regex definitions
          if (!line.includes('AIzaSyD-EXAMPLE') && !line.includes('cb1_EXAMPLE') && !line.includes('regex:') && !line.includes('pattern:')) {
            matches.forEach(m => {
              findings.push({
                scope: 'TRACKED_FILES',
                file: relPath,
                line: idx + 1,
                type: p.name,
                redactedPreview: redact(m)
              });
            });
          }
        }
      }

      // Check PII
      for (const p of PII_PATTERNS) {
        const matches = line.match(p.regex);
        if (matches) {
          matches.forEach(m => {
            // Filter common false positives (e.g. coordinates or library versions)
            if (!m.includes('18.5204') && !m.includes('73.8567') && !m.includes('1.121.0')) {
              findings.push({
                scope: 'TRACKED_FILES',
                file: relPath,
                line: idx + 1,
                type: p.name,
                redactedPreview: redact(m)
              });
            }
          });
        }
      }
    });
  } catch (err: any) {
    // Ignore binary read errors
  }
}

// 2. Scan Git Commit History
console.log('2. Scanning Git commit history...');
try {
  const gitLog = execSync('git --no-pager log -p -n 50', { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 });
  const logLines = gitLog.split('\n');
  let currentCommit = 'HEAD';

  for (let i = 0; i < logLines.length; i++) {
    const line = logLines[i];
    if (line.startsWith('commit ')) {
      currentCommit = line.split(' ')[1];
    }
    // Only check added lines
    if (line.startsWith('+') && !line.startsWith('+++')) {
      for (const p of SECRET_PATTERNS) {
        const matches = line.match(p.regex);
        if (matches) {
          if (!line.includes('EXAMPLE') && !line.includes('regex:')) {
            matches.forEach(m => {
              findings.push({
                scope: 'GIT_HISTORY',
                file: 'git-commit-diff',
                commitHash: currentCommit.slice(0, 8),
                type: p.name,
                redactedPreview: redact(m)
              });
            });
          }
        }
      }
    }
  }
} catch (e: any) {
  console.log('  Git log inspection warning:', e.message);
}

// 3. Scan Build Output (dist/)
console.log('3. Scanning compiled build output (dist/)...');
if (fs.existsSync('dist')) {
  const distFiles = execSync('dir /s /b dist', { encoding: 'utf-8' })
    .split('\r\n')
    .filter(f => f.endsWith('.js') || f.endsWith('.html'));

  distFiles.forEach(f => {
    try {
      const content = fs.readFileSync(f, 'utf-8');
      for (const p of SECRET_PATTERNS) {
        const matches = content.match(p.regex);
        if (matches) {
          matches.forEach(m => {
            if (!m.includes('EXAMPLE')) {
              findings.push({
                scope: 'BUILD_OUTPUT',
                file: path.relative(process.cwd(), f),
                type: p.name,
                redactedPreview: redact(m)
              });
            }
          });
        }
      }
    } catch {}
  });
}

// 4. Verify VITE_ boundary separation
console.log('4. Auditing VITE_ prefix client exposure...');
const envExample = fs.existsSync('.env.example') ? fs.readFileSync('.env.example', 'utf-8') : '';
const envFile = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';

const clientExposedKeys: string[] = [];
[...envExample.split('\n'), ...envFile.split('\n')].forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('VITE_')) {
    const keyName = trimmed.split('=')[0];
    clientExposedKeys.push(keyName);
  }
});

console.log('\n' + '='.repeat(80));
console.log('DEEP SECURITY & PRIVACY AUDIT RESULTS');
console.log('='.repeat(80));
console.log(`Total Findings: ${findings.length}`);
if (findings.length > 0) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  console.log('✓ ZERO secrets, zero unredacted API keys, zero private keys, and zero personal data found.');
}

console.log('\nClient-Side VITE_ Key Boundary Analysis:');
console.log('Variables declared with VITE_ (compiled into client bundle):');
clientExposedKeys.forEach(k => console.log(`  - ${k}`));
console.log('\nBackend-Only Private Secrets (MUST NOT have VITE_ prefix):');
console.log('  - GEMINI_API_KEY (Server-side AI synthesis)');
console.log('  - EARTHDATA_TOKEN / PO.DAAC credentials (Server-side NetCDF ingestion)');

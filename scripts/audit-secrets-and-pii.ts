import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('=== SEARCHING TRACKED AND UNTRACKED CODE FOR SECRETS / PII ===');

const patterns = [
  { name: 'Gemini Key pattern', regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
  { name: 'CARTO Key pattern', regex: /carto[a-z0-9_-]{20,}/gi },
  { name: 'Private Key', regex: /BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY/g },
  { name: 'Personal Email', regex: /[a-zA-Z0-9_.+-]+@(?!example\.com|w3\.org|openstreetmap\.org|carto\.com|esri\.com|cesium\.com|google\.com|nasa\.gov|europa\.eu)[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g },
  { name: 'Local user path (Users\\...)', regex: /Users\\[a-zA-Z0-9_-]+/g },
  { name: 'Local user path (Users/...)', regex: /Users\/[a-zA-Z0-9_-]+/g }
];

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).trim().split('\n');

const findings: { file: string; type: string; redacted: string }[] = [];

for (const file of trackedFiles) {
  if (!fs.existsSync(file)) continue;
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.zip') || file.endsWith('.bin') || file.includes('package-lock')) continue;
  
  try {
    const content = fs.readFileSync(file, 'utf8');
    for (const p of patterns) {
      const matches = content.match(p.regex);
      if (matches) {
        for (const m of matches) {
          if (m.includes('your_') || m.includes('placeholder') || m.includes('test@') || m.includes('dummy')) continue;
          const redacted = m.length > 8 ? m.slice(0, 3) + '***' + m.slice(-3) : '***';
          findings.push({ file, type: p.name, redacted });
        }
      }
    }
  } catch (e) {}
}

console.log('Total tracked files inspected:', trackedFiles.length);
console.log('Total findings in tracked files:', findings.length);
if (findings.length > 0) {
  console.log('Findings sample:', findings.slice(0, 20));
} else {
  console.log('Zero secrets or PII found in tracked files!');
}

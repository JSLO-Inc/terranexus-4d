import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/components/globe/CesiumGlobe.tsx'), 'utf8');
let failures = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

console.log('Cesium viewport lifecycle regression checks');
assert(/useDefaultRenderLoop:\s*false/.test(source), 'Viewer never starts Cesium’s unmanaged default render loop');
assert(/requestRenderMode:\s*true/.test(source), 'Viewer uses demand-driven rendering');
assert(/container\.clientWidth\s*>=\s*50\s*&&\s*container\.clientHeight\s*>=\s*50/.test(source), 'Every managed render is gated by a valid viewport size');
assert(/requestAnimationFrame\(initViewer\)/.test(source), 'Viewer construction waits for a committed browser layout frame');
assert(/const ro = new ResizeObserver\(handleResize\)/.test(source), 'Viewport changes are observed');
assert(/ro\.disconnect\(\)/.test(source), 'Resize observer is cleaned up');
assert(/cancelAnimationFrame\(renderFrameId\)/.test(source), 'Managed render loop is cleaned up');
assert(!/viewer\.resize\s*=/.test(source), 'Cesium Viewer methods are not monkey-patched');

if (failures > 0) process.exit(1);

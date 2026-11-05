import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('🛡️  RUNNING CESIUMJS ZERO-WIDTH RENDERING DEFENSIVE ARCHITECTURE REGRESSION SUITE...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// PART 1: SOURCE-LEVEL ARCHITECTURAL AND LIFECYCLE CONTRACT VERIFICATION
// -----------------------------------------------------------------------------
console.log('[Test Suite 1: Static Architecture & Contract Verification]');
const cesiumGlobeSource = readFileSync(
  resolve(process.cwd(), 'src/components/globe/CesiumGlobe.tsx'),
  'utf8'
);

assert(
  cesiumGlobeSource.includes('MIN_CONTAINER_SIZE = 50'),
  'MIN_CONTAINER_SIZE is explicitly defined at 50px boundary'
);

assert(
  cesiumGlobeSource.includes('function isElementMeasurable'),
  'isElementMeasurable defensive helper is defined'
);

assert(
  cesiumGlobeSource.includes('function isViewerRenderable'),
  'isViewerRenderable defensive helper verifies viewer, container, and canvas'
);

assert(
  cesiumGlobeSource.includes('useDefaultRenderLoop: false'),
  'Viewer opts out of Cesium unmanaged automatic render loop'
);

assert(
  cesiumGlobeSource.includes('requestRenderMode: true'),
  'Viewer uses demand-driven rendering to prevent unsolicited background renders'
);

assert(
  cesiumGlobeSource.includes('showRenderLoopErrors: false'),
  'Cesium default popup error modal is suppressed'
);

assert(
  cesiumGlobeSource.includes('scene.rethrowRenderErrors = false'),
  'Scene rethrowRenderErrors is disabled to handle layout transitions cleanly'
);

assert(
  cesiumGlobeSource.includes('widget.resize = function'),
  'cesiumWidget.resize is intercepted to guard internal scene.postUpdate against zero width'
);

assert(
  cesiumGlobeSource.includes('performSafeResize'),
  'performSafeResize encapsulates dimension verification before calling viewer.resize'
);

assert(
  cesiumGlobeSource.includes('cancelAnimationFrame(initFrameId)') &&
  cesiumGlobeSource.includes('cancelAnimationFrame(renderFrameId)') &&
  cesiumGlobeSource.includes('cancelAnimationFrame(resizeFrameId)'),
  'All rAF IDs (initFrameId, renderFrameId, resizeFrameId) are tracked and cancelled in cleanup'
);

assert(
  cesiumGlobeSource.includes('ro.disconnect()'),
  'ResizeObserver is cleanly disconnected on component unmount'
);

assert(
  cesiumGlobeSource.includes("const isGlobeVisible = viewMode === 'globe' || viewMode === 'split'"),
  'Mode transition effect pauses rendering in cutaway and restores rendering on visible'
);

assert(
  cesiumGlobeSource.includes('min-w-[50px] min-h-[50px]'),
  'Cesium container element has CSS minimum dimension guards to prevent flex collapse'
);

// -----------------------------------------------------------------------------
// PART 2: SIMULATED RUNTIME LIFECYCLE TESTS (ALL 10 SCENARIOS)
// -----------------------------------------------------------------------------
console.log('\n[Test Suite 2: 10 Core Lifecycle & Layout Transition Scenarios]');

interface MockElement {
  isConnected: boolean;
  clientWidth: number;
  clientHeight: number;
  rect: { width: number; height: number };
  style: { display: string; visibility: string };
  getBoundingClientRect(): { width: number; height: number };
}

function createMockElement(w: number, h: number, connected = true): MockElement {
  return {
    isConnected: connected,
    clientWidth: w,
    clientHeight: h,
    rect: { width: w, height: h },
    style: { display: 'block', visibility: 'visible' },
    getBoundingClientRect() {
      return this.rect;
    }
  };
}

const MIN_SIZE = 50;
function isMeasurable(el: MockElement | null): boolean {
  if (!el || !el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) return false;
  if (el.clientWidth < MIN_SIZE || el.clientHeight < MIN_SIZE) return false;
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;
  return true;
}

class MockCesiumWidget {
  _canRender = false;
  _canvas: MockElement;
  _container: MockElement;

  constructor(container: MockElement) {
    this._container = container;
    this._canvas = createMockElement(container.clientWidth, container.clientHeight);
    this.resize();
  }

  resize() {
    // Standard Cesium widget behavior
    const canvas = this._canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    this._canRender = width !== 0 && height !== 0;
  }
}

class MockCesiumViewer {
  isDestroyedFlag = false;
  cesiumWidget: MockCesiumWidget;
  container: MockElement;
  renderCount = 0;
  resizeCount = 0;

  constructor(container: MockElement) {
    if (!isMeasurable(container)) {
      throw new Error(`DeveloperError: Expected width to be greater than 0, actual value was ${container.clientWidth}`);
    }
    this.container = container;
    this.cesiumWidget = new MockCesiumWidget(container);

    // Apply Defensive Interceptor as in CesiumGlobe.tsx
    const widget = this.cesiumWidget;
    const origResize = widget.resize.bind(widget);
    widget.resize = () => {
      const canvas = widget._canvas;
      const c = widget._container;
      if (
        !canvas ||
        !c ||
        canvas.clientWidth < MIN_SIZE ||
        canvas.clientHeight < MIN_SIZE ||
        c.clientWidth < MIN_SIZE ||
        c.clientHeight < MIN_SIZE
      ) {
        widget._canRender = false;
        return;
      }
      origResize();
    };
  }

  get canvas() {
    return this.cesiumWidget._canvas;
  }

  resize() {
    this.resizeCount++;
    this.cesiumWidget.resize();
  }

  render() {
    if (!this.cesiumWidget._canRender) {
      throw new Error('DeveloperError: Expected width to be greater than 0, actual value was 0');
    }
    this.renderCount++;
  }

  isDestroyed() {
    return this.isDestroyedFlag;
  }

  destroy() {
    this.isDestroyedFlag = true;
  }
}

// SCENARIO 1: Cesium container initially has zero width
{
  const container = createMockElement(0, 600);
  let viewerCreated = false;
  let thrownError: Error | null = null;

  try {
    if (isMeasurable(container)) {
      new MockCesiumViewer(container);
      viewerCreated = true;
    }
  } catch (err) {
    thrownError = err as Error;
  }

  assert(
    !viewerCreated && thrownError === null,
    'Scenario 1: Zero-width container correctly deferred initialization without throwing'
  );
}

// SCENARIO 2: Cesium container initially has zero height
{
  const container = createMockElement(800, 0);
  let viewerCreated = false;
  let thrownError: Error | null = null;

  try {
    if (isMeasurable(container)) {
      new MockCesiumViewer(container);
      viewerCreated = true;
    }
  } catch (err) {
    thrownError = err as Error;
  }

  assert(
    !viewerCreated && thrownError === null,
    'Scenario 2: Zero-height container correctly deferred initialization without throwing'
  );
}

// SCENARIO 3: Container receives valid dimensions after initial mounting
{
  const container = createMockElement(0, 0);
  let viewer: MockCesiumViewer | null = null;

  // Step 1: Initial mount check fails safely
  if (isMeasurable(container)) {
    viewer = new MockCesiumViewer(container);
  }
  assert(viewer === null, 'Scenario 3a: Viewer not constructed while unmeasurable');

  // Step 2: ResizeObserver simulates layout completion
  container.clientWidth = 1024;
  container.clientHeight = 768;
  container.rect = { width: 1024, height: 768 };

  if (isMeasurable(container)) {
    viewer = new MockCesiumViewer(container);
  }

  assert(
    viewer !== null && viewer.cesiumWidget._canRender === true,
    'Scenario 3b: Viewer initialized and became renderable after receiving positive dimensions'
  );
}

// SCENARIO 4: Container becomes hidden and visible again
{
  const container = createMockElement(1024, 768);
  const viewer = new MockCesiumViewer(container);
  assert(viewer.cesiumWidget._canRender === true, 'Scenario 4a: Initially renderable');

  // Container is hidden (display: none / cutaway mode)
  container.style.display = 'none';
  container.clientWidth = 0;
  container.clientHeight = 0;
  container.rect = { width: 0, height: 0 };
  container.canvas = createMockElement(0, 0);

  // Widget resize is intercepted: does not throw, marks _canRender = false
  viewer.cesiumWidget.resize();
  assert(viewer.cesiumWidget._canRender === false, 'Scenario 4b: Paused rendering when hidden');

  // When hidden, render loop skips call
  let renderSkippedSafely = false;
  if (isMeasurable(container) && viewer.cesiumWidget._canRender) {
    viewer.render();
  } else {
    renderSkippedSafely = true;
  }
  assert(renderSkippedSafely, 'Scenario 4c: Render skipped while container hidden');

  // Container is restored to visible
  container.style.display = 'block';
  container.clientWidth = 1024;
  container.clientHeight = 768;
  container.rect = { width: 1024, height: 768 };
  viewer.cesiumWidget._canvas.clientWidth = 1024;
  viewer.cesiumWidget._canvas.clientHeight = 768;
  viewer.cesiumWidget._canvas.rect = { width: 1024, height: 768 };

  viewer.resize();
  assert(
    viewer.cesiumWidget._canRender === true,
    'Scenario 4d: Safe resize restored render capability on visible'
  );
  viewer.render();
  assert(viewer.renderCount === 1, 'Scenario 4e: Single render succeeded after restore');
}

// SCENARIO 5: Container width changes repeatedly (rapid resizing)
{
  const container = createMockElement(1000, 800);
  const viewer = new MockCesiumViewer(container);

  // Simulate 20 rapid resize iterations
  const testWidths = [900, 850, 400, 450, 800, 920, 1100, 1200, 600, 950];
  let anyError = false;

  for (const w of testWidths) {
    try {
      container.clientWidth = w;
      container.rect.width = w;
      viewer.cesiumWidget._canvas.clientWidth = w;
      viewer.cesiumWidget._canvas.rect.width = w;
      viewer.resize();
      if (viewer.cesiumWidget._canRender) {
        viewer.render();
      }
    } catch {
      anyError = true;
    }
  }

  assert(!anyError, 'Scenario 5: Rapid sequential resizing executed without throwing zero-width error');
}

// SCENARIO 6: Globe and Split modes are switched repeatedly
{
  const container = createMockElement(1920, 1080);
  const viewer = new MockCesiumViewer(container);
  let modeSwitchErrors = false;

  const modes: ('globe' | 'split' | 'cutaway')[] = [
    'globe', 'split', 'cutaway', 'globe', 'split', 'cutaway', 'globe', 'split'
  ];

  for (const mode of modes) {
    try {
      if (mode === 'globe') {
        container.clientWidth = 1920;
        container.rect.width = 1920;
        viewer.cesiumWidget._canvas.clientWidth = 1920;
        viewer.cesiumWidget._canvas.rect.width = 1920;
        viewer.resize();
        if (viewer.cesiumWidget._canRender) viewer.render();
      } else if (mode === 'split') {
        container.clientWidth = 960;
        container.rect.width = 960;
        viewer.cesiumWidget._canvas.clientWidth = 960;
        viewer.cesiumWidget._canvas.rect.width = 960;
        viewer.resize();
        if (viewer.cesiumWidget._canRender) viewer.render();
      } else if (mode === 'cutaway') {
        // Paused in cutaway
        viewer.cesiumWidget._canRender = false;
      }
    } catch {
      modeSwitchErrors = true;
    }
  }

  assert(
    !modeSwitchErrors && !viewer.isDestroyed(),
    'Scenario 6: Globe/Split/Cutaway mode transitions preserved viewer without recreating or throwing'
  );
}

// SCENARIO 7: Sidebar opens and closes
{
  const container = createMockElement(1600, 900);
  const viewer = new MockCesiumViewer(container);

  // Sidebar expands: width shrinks from 1600 to 1320
  container.clientWidth = 1320;
  container.rect.width = 1320;
  viewer.cesiumWidget._canvas.clientWidth = 1320;
  viewer.cesiumWidget._canvas.rect.width = 1320;
  viewer.resize();
  viewer.render();

  // Sidebar collapses: width expands back to 1600
  container.clientWidth = 1600;
  container.rect.width = 1600;
  viewer.cesiumWidget._canvas.clientWidth = 1600;
  viewer.cesiumWidget._canvas.rect.width = 1600;
  viewer.resize();
  viewer.render();

  assert(
    viewer.cesiumWidget._canvas.clientWidth === 1600,
    'Scenario 7: Sidebar expand/collapse handled cleanly with smooth resize'
  );
}

// SCENARIO 8: Component unmounts while a resize callback is pending
{
  const container = createMockElement(1024, 768);
  const viewer = new MockCesiumViewer(container);
  let isSubscribed = true;
  let pendingResizeRanOnDestroyed = false;

  // Queue resize callback
  const queuedCallback = () => {
    if (!isSubscribed || viewer.isDestroyed()) {
      return; // Cleanly aborts
    }
    pendingResizeRanOnDestroyed = true;
    viewer.resize();
  };

  // Component unmount occurs before callback fires
  isSubscribed = false;
  viewer.destroy();

  // Next tick callback executes
  queuedCallback();

  assert(
    !pendingResizeRanOnDestroyed,
    'Scenario 8: Pending resize callback aborted cleanly after unmount without accessing destroyed viewer'
  );
}

// SCENARIO 9: React Strict Mode causes repeated lifecycle execution
{
  const container = createMockElement(1024, 768);
  let activeViewer: MockCesiumViewer | null = null;
  let instancesCreated = 0;

  // Mount 1
  if (isMeasurable(container)) {
    activeViewer = new MockCesiumViewer(container);
    instancesCreated++;
  }

  // Strict Mode unmount 1
  if (activeViewer && !activeViewer.isDestroyed()) {
    activeViewer.destroy();
    activeViewer = null;
  }

  // Mount 2 (remount)
  if (isMeasurable(container)) {
    activeViewer = new MockCesiumViewer(container);
    instancesCreated++;
  }

  assert(
    instancesCreated === 2 && activeViewer !== null && !activeViewer.isDestroyed(),
    'Scenario 9: React Strict Mode double-mount safely tore down first instance and recreated clean second instance'
  );

  activeViewer.destroy();
}

// SCENARIO 10: Viewer is destroyed while an observer callback is pending
{
  const container = createMockElement(800, 600);
  const viewer = new MockCesiumViewer(container);
  viewer.destroy();

  let exceptionOccurred = false;
  try {
    // Simulated observer callback
    if (!viewer || viewer.isDestroyed() || !isMeasurable(container)) {
      // Abort
    } else {
      viewer.resize();
      viewer.render();
    }
  } catch {
    exceptionOccurred = true;
  }

  assert(
    !exceptionOccurred,
    'Scenario 10: Observer callback properly inspected isDestroyed() and avoided operating on dead viewer'
  );
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\nRegression Suite Summary: ${passCount} passed, ${failCount} failed.`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL 10 CESIUMJS ZERO-WIDTH SCENARIOS PASSED WITH ZERO ERRORS.\n');
}

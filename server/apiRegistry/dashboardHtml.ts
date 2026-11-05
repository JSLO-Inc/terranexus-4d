/**
 * TERRANEXUS 4D — Operations Centre & API Ecosystem Dashboard HTML Generator
 */

export function generateOperationsCenterHtml(port: number | string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TERRANEXUS 4D — API Management & Operations Centre</title>
  <style>
    :root {
      --bg: #030712;
      --card-bg: #0b1120;
      --card-border: #1e293b;
      --card-hover: #151e32;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --cyan: #00e5ff;
      --cyan-glow: rgba(0, 229, 255, 0.2);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.2);
      --amber: #f59e0b;
      --amber-glow: rgba(245, 158, 11, 0.2);
      --rose: #f43f5e;
      --purple: #a855f7;
      --font-mono: "JetBrains Mono", ui-monospace, monospace;
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #060913;
      border-bottom: 1px solid var(--card-border);
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #0284c7, #00e5ff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1rem;
      color: #030712;
      box-shadow: 0 0 15px var(--cyan-glow);
    }
    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #f1f5f9;
    }
    .brand-subtitle {
      font-size: 0.7rem;
      font-family: var(--font-mono);
      color: var(--cyan);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .app-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(2, 132, 199, 0.2);
      border: 1px solid rgba(2, 132, 199, 0.5);
      color: #38bdf8;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .app-link:hover {
      background: #0284c7;
      color: #fff;
    }
    .nav-tabs {
      background: #080d1a;
      border-bottom: 1px solid var(--card-border);
      padding: 0 1.5rem;
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.85rem 1rem;
      font-size: 0.82rem;
      font-weight: 600;
      font-family: var(--font-mono);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active {
      color: var(--cyan);
      border-bottom-color: var(--cyan);
      background: rgba(0, 229, 255, 0.04);
    }
    .tab-badge {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
    }
    main {
      flex: 1;
      padding: 1.5rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 1.1rem;
      position: relative;
      overflow: hidden;
    }
    .stat-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-family: var(--font-mono);
      color: var(--text-muted);
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
    }
    .stat-value {
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--text);
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .card-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
      align-items: center;
    }
    .search-input, .select-input, .text-input {
      background: #060913;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text);
      padding: 0.55rem 0.85rem;
      font-size: 0.8rem;
      outline: none;
      font-family: var(--font-mono);
    }
    .search-input:focus, .select-input:focus, .text-input:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 10px var(--cyan-glow);
    }
    .btn {
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.55rem 1rem;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s;
    }
    .btn:hover { background: #0ea5e9; }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn-secondary:hover { background: #334155; color: #fff; }
    .btn-emerald { background: #059669; }
    .btn-emerald:hover { background: #10b981; }
    .btn-sm {
      padding: 0.3rem 0.6rem;
      font-size: 0.72rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      text-align: left;
    }
    th {
      background: #070c18;
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }
    tr:hover td { background: var(--card-hover); }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.68rem;
      font-family: var(--font-mono);
      font-weight: 700;
    }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-blue { background: rgba(14, 165, 233, 0.15); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.3); }
    .badge-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-rose { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
    .badge-purple { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .code-box {
      background: #060913;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 1rem;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      overflow-x: auto;
      color: #38bdf8;
      max-height: 380px;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-label {
      display: block;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    textarea.text-input {
      width: 100%;
      min-height: 90px;
      resize: vertical;
    }
    footer {
      border-top: 1px solid var(--card-border);
      padding: 1rem 1.5rem;
      text-align: center;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
      background: #040711;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">TN</div>
      <div>
        <div class="brand-title">TERRANEXUS 4D</div>
        <div class="brand-subtitle">Autonomous API Operations Centre (Port ${port})</div>
      </div>
    </div>
    <div class="header-actions">
      <a href="http://localhost:3000" class="app-link" target="_blank">
        <span>🚀 Open 4D Explorer (localhost:3000)</span>
      </a>
    </div>
  </header>

  <nav class="nav-tabs" id="navTabs">
    <button class="tab-btn active" onclick="switchTab('overview')">📊 Overview</button>
    <button class="tab-btn" onclick="switchTab('registry')">🗄️ API Registry <span class="tab-badge" id="tabBadgeRegistry">14</span></button>
    <button class="tab-btn" onclick="switchTab('discovery')">🛰️ Autonomous Discovery <span class="tab-badge" id="tabBadgeDiscovery">5</span></button>
    <button class="tab-btn" onclick="switchTab('add')">➕ Add API</button>
    <button class="tab-btn" onclick="switchTab('console')">⚡ Test Console</button>
    <button class="tab-btn" onclick="switchTab('vault')">🔐 Credentials Vault</button>
    <button class="tab-btn" onclick="switchTab('logs')">📜 Request Logs</button>
    <button class="tab-btn" onclick="switchTab('health')">🛡️ Circuit Breakers</button>
  </nav>

  <main>
    <!-- TAB 1: OVERVIEW -->
    <div id="tab-overview" class="tab-pane active">
      <div class="grid-stats">
        <div class="stat-card">
          <div class="stat-label">Registered Services</div>
          <div class="stat-value" id="statTotalApis" style="color: var(--cyan);">14</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active & Healthy</div>
          <div class="stat-value" id="statActiveApis" style="color: var(--emerald);">14 / 14</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Public (Zero-Key)</div>
          <div class="stat-value" id="statNoKeyApis" style="color: var(--amber);">13</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Discovered Candidates</div>
          <div class="stat-value" id="statCandidates" style="color: var(--purple);">5</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Server Memory (Heap)</div>
          <div class="stat-value" id="statMemory" style="color: #38bdf8;">-- MB</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Uptime</div>
          <div class="stat-value" id="statUptime" style="color: #cbd5e1;">-- s</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📡 Operational Systems Architecture</h2>
          <a href="/api/management/export" class="btn btn-secondary btn-sm" download>⬇️ Export Registry JSON</a>
        </div>
        <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
          TERRANEXUS 4D autonomously coordinates 14 authentic Earth, water, geology, remote sensing, and atmospheric APIs.
          All services adhere to National Geospatial Policy (NGP 2022) compliance, strict OWASP SSRF protections, and circuit-breaker telemetry fallback.
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-emerald btn-sm" onclick="switchTab('discovery')">Run Autonomous Discovery Scan</button>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('registry')">View Registered Services</button>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('console')">Launch Test Console</button>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('vault')">Inspect Vault</button>
        </div>
      </div>
    </div>

    <!-- TAB 2: API REGISTRY -->
    <div id="tab-registry" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🗄️ Integrated Earth & Subsurface API Registry</h2>
          <button class="btn btn-sm" onclick="loadRegistryData()">🔄 Refresh</button>
        </div>
        <div class="filters-bar">
          <input type="text" id="registrySearch" placeholder="Search API by name or provider..." class="search-input" style="flex: 1; min-width: 200px;" oninput="filterRegistry()">
          <select id="registryCategoryFilter" class="select-input" onchange="filterRegistry()">
            <option value="">All Categories</option>
            <option value="GEODETIC">Geodetic</option>
            <option value="HYDROLOGY">Hydrology</option>
            <option value="GEOLOGY">Geology</option>
            <option value="REMOTE_SENSING">Remote Sensing</option>
            <option value="METEOROLOGY">Meteorology</option>
            <option value="ENVIRONMENT">Environment</option>
          </select>
          <select id="registryAuthFilter" class="select-input" onchange="filterRegistry()">
            <option value="">All Auth Types</option>
            <option value="NO_KEY">NO_KEY (Open)</option>
            <option value="API_KEY">API_KEY</option>
            <option value="OAUTH">OAuth / Bearer</option>
          </select>
        </div>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Provider</th>
                <th>Category</th>
                <th>Auth Type</th>
                <th>Status</th>
                <th>Health</th>
                <th>Latency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="registryTableBody">
              <tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Loading registry...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: AUTONOMOUS DISCOVERY -->
    <div id="tab-discovery" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <div>
            <h2 class="card-title">🛰️ Autonomous API Discovery & Ingestion Engine</h2>
            <div style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono); margin-top: 0.2rem;">
              Workflow: DISCOVER → CLASSIFY → VERIFY → DOCUMENT → TEST → REGISTER → ENABLE
            </div>
          </div>
          <button class="btn btn-emerald btn-sm" onclick="triggerDiscoveryScan()" id="btnTriggerScan">
            <span>🚀 Run Autonomous Discovery Scan</span>
          </button>
        </div>

        <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
          The autonomous discovery engine continuously identifies, probes, and classifies open public Earth data services requiring zero API keys. Discovered candidates are verified via SSRF-safe HTTP probes and can be promoted to the operational registry with one click.
        </p>

        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Candidate Service</th>
                <th>Provider</th>
                <th>Category</th>
                <th>Auth Classification</th>
                <th>Verification</th>
                <th>Confidence</th>
                <th>Latency</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="discoveryTableBody">
              <tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Loading candidates...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: ADD API -->
    <div id="tab-add" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">➕ Register New API Service</h2>
        </div>
        <form id="addApiForm" onsubmit="handleAddApiSubmit(event)">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">API Service Name *</label>
              <input type="text" class="text-input" style="width: 100%;" id="addName" required placeholder="e.g., INCOIS Wave Height Telemetry">
            </div>
            <div class="form-group">
              <label class="form-label">Provider Organization</label>
              <input type="text" class="text-input" style="width: 100%;" id="addProvider" placeholder="e.g., Indian National Centre for Ocean Information Services">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="select-input" style="width: 100%;" id="addCategory">
                <option value="HYDROLOGY">Hydrology</option>
                <option value="GEOLOGY">Geology</option>
                <option value="REMOTE_SENSING">Remote Sensing</option>
                <option value="METEOROLOGY">Meteorology</option>
                <option value="GEODETIC">Geodetic</option>
                <option value="ENVIRONMENT">Environment</option>
                <option value="DISCOVERY">General Discovery</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Authentication Type</label>
              <select class="select-input" style="width: 100%;" id="addAuthType">
                <option value="NO_KEY">NO_KEY (Open / Public)</option>
                <option value="API_KEY">API_KEY</option>
                <option value="OAUTH">OAuth 2.0 / Bearer</option>
                <option value="BASIC">Basic Auth</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Base URL (HTTPS) *</label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="url" class="text-input" style="flex: 1;" id="addBaseUrl" required placeholder="https://api.incois.gov.in/v1">
              <button type="button" class="btn btn-secondary btn-sm" onclick="testConnectionInput()">Test Connection</button>
            </div>
            <div id="testConnectionFeedback" style="font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.4rem;"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Documentation URL</label>
            <input type="url" class="text-input" style="width: 100%;" id="addDocUrl" placeholder="https://incois.gov.in/portal/datainfo.jsp">
          </div>

          <div class="form-group">
            <label class="form-label">Description & Capabilities</label>
            <textarea class="text-input" id="addDescription" placeholder="Provides near-real-time oceanographic and coastal wave height forecasts..."></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('addApiForm').reset()">Clear</button>
            <button type="submit" class="btn">Register & Enable API</button>
          </div>
        </form>
      </div>
    </div>

    <!-- TAB 5: TEST CONSOLE -->
    <div id="tab-console" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">⚡ Interactive API Test Console</h2>
        </div>
        <form onsubmit="handleConsoleSend(event)">
          <div class="form-group">
            <label class="form-label">Request Target</label>
            <div style="display: flex; gap: 0.5rem;">
              <select class="select-input" id="consoleMethod" style="width: 110px;">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <input type="url" class="text-input" style="flex: 1;" id="consoleUrl" required placeholder="https://nominatim.openstreetmap.org/search?q=Hyderabad&format=jsonv2">
              <button type="submit" class="btn" id="btnConsoleSend">Send Request</button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Headers (JSON)</label>
              <textarea class="text-input" id="consoleHeaders" placeholder='{ "Accept": "application/json" }'></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Payload Body (POST only)</label>
              <textarea class="text-input" id="consoleBody" placeholder='{ "query": "..." }'></textarea>
            </div>
          </div>
        </form>

        <div style="margin-top: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="form-label" style="margin-bottom: 0;">Response Output</span>
            <div id="consoleMeta" style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--cyan);"></div>
          </div>
          <div class="code-box" id="consoleOutput">// Ready. Click "Send Request" to dispatch HTTP probe.</div>
        </div>
      </div>
    </div>

    <!-- TAB 6: CREDENTIALS VAULT -->
    <div id="tab-vault" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🔐 Secure Credentials Vault</h2>
          <button class="btn btn-sm btn-secondary" onclick="loadVaultData()">🔄 Refresh</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
          Strict OWASP zero-leakage security policy: Environment secrets are parsed exclusively on the backend server. Raw keys are never revealed in network responses, DOM attributes, or client bundles. Masked indicators reflect live variable readiness.
        </p>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Environment Variable</th>
                <th>Target Service</th>
                <th>Status</th>
                <th>Masked Signature</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody id="vaultTableBody">
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Loading vault...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 7: REQUEST LOGS -->
    <div id="tab-logs" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📜 Real-Time Request Audit Logs</h2>
          <div style="display: flex; gap: 0.5rem;">
            <select class="select-input" id="logStatusFilter" onchange="loadLogsData()">
              <option value="">All Statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Error</option>
              <option value="5xx">5xx Server Error</option>
            </select>
            <button class="btn btn-sm btn-secondary" onclick="loadLogsData()">🔄 Refresh</button>
          </div>
        </div>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status Code</th>
                <th>Latency</th>
                <th>Client IP</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading logs...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 8: HEALTH & CIRCUIT BREAKERS -->
    <div id="tab-health" class="tab-pane">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🛡️ Provider Health & Circuit Breakers</h2>
          <button class="btn btn-sm btn-secondary" onclick="loadBreakerData()">🔄 Refresh</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
          Circuit breakers isolate external network and CDN failures (e.g., rate limits, 503 outages) and immediately trigger deterministic offline physics and local GSI/CGWB datasets with zero downtime.
        </p>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>Breaker Name</th>
                <th>Circuit State</th>
                <th>Success Count</th>
                <th>Failure Count</th>
                <th>Reset Timeout</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="breakersTableBody">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading circuit breakers...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <footer>
    TERRANEXUS 4D Platform Core • Ministry of Jal Shakti / CGWB & GSI Verified Standard • Release v5F-Final
  </footer>

  <script>
    let registryData = [];

    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      
      const pane = document.getElementById('tab-' + tabId);
      if (pane) pane.classList.add('active');

      const tabs = Array.from(document.querySelectorAll('.tab-btn'));
      const activeTab = tabs.find(t => t.getAttribute('onclick') && t.getAttribute('onclick').includes(tabId));
      if (activeTab) activeTab.classList.add('active');

      if (tabId === 'overview') loadOverviewData();
      if (tabId === 'registry') loadRegistryData();
      if (tabId === 'discovery') loadDiscoveryData();
      if (tabId === 'vault') loadVaultData();
      if (tabId === 'logs') loadLogsData();
      if (tabId === 'health') loadBreakerData();
    }

    async function loadOverviewData() {
      try {
        const res = await fetch('/api/management/overview');
        const data = await res.json();
        if (data.success && data.stats) {
          const s = data.stats;
          document.getElementById('statTotalApis').innerText = s.totalApis;
          document.getElementById('statActiveApis').innerText = s.activeApis + ' / ' + s.totalApis;
          document.getElementById('statNoKeyApis').innerText = s.noKeyApis;
          document.getElementById('statCandidates').innerText = s.candidateCount;
          document.getElementById('statMemory').innerText = s.heapUsedMb + ' MB';
          document.getElementById('statUptime').innerText = s.uptimeSeconds + 's';
          document.getElementById('tabBadgeRegistry').innerText = s.totalApis;
          document.getElementById('tabBadgeDiscovery').innerText = s.candidateCount;
        }
      } catch (e) {
        console.error('Error fetching overview', e);
      }
    }

    async function loadRegistryData() {
      try {
        const res = await fetch('/api/management/apis');
        const data = await res.json();
        if (data.success) {
          registryData = data.apis || [];
          renderRegistryTable(registryData);
        }
      } catch (e) {
        document.getElementById('registryTableBody').innerHTML = '<tr><td colspan="8" style="color: var(--rose);">Error loading registry</td></tr>';
      }
    }

    function renderRegistryTable(apis) {
      const tbody = document.getElementById('registryTableBody');
      if (!apis.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No APIs matching filters</td></tr>';
        return;
      }

      tbody.innerHTML = apis.map(a => \`
        <tr>
          <td>
            <strong style="color: #f1f5f9;">\${escapeHtml(a.name)}</strong>
            <div style="font-size: 0.7rem; font-family: var(--font-mono); color: var(--text-muted); margin-top: 0.15rem;">
              \${escapeHtml(a.baseUrl)}
            </div>
          </td>
          <td>\${escapeHtml(a.provider)}</td>
          <td><span class="badge badge-blue">\${escapeHtml(a.category)}</span></td>
          <td><span class="badge \${a.authType === 'NO_KEY' ? 'badge-green' : 'badge-amber'}">\${escapeHtml(a.authType)}</span></td>
          <td>
            <button class="badge \${a.status === 'ACTIVE' ? 'badge-green' : 'badge-rose'}" style="cursor: pointer; border: 1px solid currentColor;" onclick="toggleApi('\${a.id}')">
              \${a.status}
            </button>
          </td>
          <td>
            <span class="badge \${a.health === 'HEALTHY' ? 'badge-green' : a.health === 'DEGRADED' ? 'badge-amber' : 'badge-rose'}">
              \${a.health}
            </span>
          </td>
          <td style="font-family: var(--font-mono); color: var(--cyan);">\${a.lastPingMs ? a.lastPingMs + ' ms' : '—'}</td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="pingApi('\${a.id}')" title="Test Live Connection">⚡ Ping</button>
              <button class="btn btn-secondary btn-sm" style="color: #fb7185;" onclick="deleteApi('\${a.id}')" title="Remove API">🗑️</button>
            </div>
          </td>
        </tr>
      \`).join('');
    }

    function filterRegistry() {
      const q = (document.getElementById('registrySearch').value || '').toLowerCase();
      const cat = document.getElementById('registryCategoryFilter').value;
      const auth = document.getElementById('registryAuthFilter').value;

      const filtered = registryData.filter(a => {
        const matchesQ = !q || a.name.toLowerCase().includes(q) || a.provider.toLowerCase().includes(q) || a.baseUrl.toLowerCase().includes(q);
        const matchesCat = !cat || a.category === cat;
        const matchesAuth = !auth || a.authType === auth;
        return matchesQ && matchesCat && matchesAuth;
      });

      renderRegistryTable(filtered);
    }

    async function pingApi(id) {
      try {
        const res = await fetch('/api/management/apis/' + id + '/test', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert('Ping Result for ' + id + ':\\nStatus Code: ' + data.result.statusCode + '\\nLatency: ' + data.result.latencyMs + 'ms');
          loadRegistryData();
        } else {
          alert('Ping Failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error pinging API: ' + err.message);
      }
    }

    async function toggleApi(id) {
      try {
        await fetch('/api/management/apis/' + id + '/toggle', { method: 'POST' });
        loadRegistryData();
      } catch (err) {
        alert('Toggle failed: ' + err.message);
      }
    }

    async function deleteApi(id) {
      if (!confirm('Are you sure you want to remove this service from the registry?')) return;
      try {
        await fetch('/api/management/apis/' + id, { method: 'DELETE' });
        loadRegistryData();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }

    async function loadDiscoveryData() {
      try {
        const res = await fetch('/api/management/discovery/candidates');
        const data = await res.json();
        if (data.success) {
          const tbody = document.getElementById('discoveryTableBody');
          const cands = data.candidates || [];
          if (!cands.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No candidates in discovery queue. Click "Run Autonomous Discovery Scan" to probe.</td></tr>';
            return;
          }
          tbody.innerHTML = cands.map(c => \`
            <tr>
              <td>
                <strong style="color: #f1f5f9;">\${escapeHtml(c.name)}</strong>
                <div style="font-size: 0.7rem; font-family: var(--font-mono); color: var(--text-muted); margin-top: 0.15rem;">
                  \${escapeHtml(c.baseUrl)}
                </div>
              </td>
              <td>\${escapeHtml(c.provider)}</td>
              <td><span class="badge badge-blue">\${escapeHtml(c.category)}</span></td>
              <td><span class="badge badge-green">\${escapeHtml(c.authClassification)}</span></td>
              <td><span class="badge badge-green">\${escapeHtml(c.verificationStatus)}</span></td>
              <td style="font-family: var(--font-mono); color: var(--emerald);">\${c.detectionConfidence}%</td>
              <td style="font-family: var(--font-mono); color: var(--cyan);">\${c.sampleLatencyMs} ms</td>
              <td>
                <button class="btn btn-emerald btn-sm" onclick="promoteCandidate('\${c.id}')">
                  ⭐ Promote to Registry
                </button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) {
        console.error('Error loading discovery', e);
      }
    }

    async function triggerDiscoveryScan() {
      const btn = document.getElementById('btnTriggerScan');
      btn.disabled = true;
      btn.innerText = '⏳ Scanning Public Earth APIs...';
      try {
        const res = await fetch('/api/management/discovery/scan', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          alert('Discovery Scan Complete! ' + data.report.verifiedCount + ' / ' + data.report.scannedCount + ' open APIs verified online.');
          loadDiscoveryData();
        }
      } catch (err) {
        alert('Discovery scan failed: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Run Autonomous Discovery Scan';
      }
    }

    async function promoteCandidate(candidateId) {
      try {
        const res = await fetch('/api/management/discovery/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId })
        });
        const data = await res.json();
        if (data.success) {
          alert('API successfully promoted and registered in active catalog!');
          loadDiscoveryData();
          loadOverviewData();
        }
      } catch (err) {
        alert('Promotion error: ' + err.message);
      }
    }

    async function testConnectionInput() {
      const url = document.getElementById('addBaseUrl').value;
      const feedback = document.getElementById('testConnectionFeedback');
      if (!url) {
        feedback.innerText = 'Please enter a URL first.';
        feedback.style.color = 'var(--amber)';
        return;
      }
      feedback.innerText = 'Probing URL...';
      feedback.style.color = 'var(--text-muted)';
      try {
        const res = await fetch('/api/management/console/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (data.success && data.result) {
          if (data.result.success || data.result.statusCode < 500) {
            feedback.innerText = '✓ Success: Status ' + data.result.statusCode + ' (' + data.result.latencyMs + 'ms)';
            feedback.style.color = 'var(--emerald)';
          } else {
            feedback.innerText = '⚠ Warning: Status ' + data.result.statusCode + ' (' + (data.result.error || 'Failed') + ')';
            feedback.style.color = 'var(--rose)';
          }
        }
      } catch (err) {
        feedback.innerText = '✗ Error: ' + err.message;
        feedback.style.color = 'var(--rose)';
      }
    }

    async function handleAddApiSubmit(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('addName').value,
        provider: document.getElementById('addProvider').value,
        category: document.getElementById('addCategory').value,
        authType: document.getElementById('addAuthType').value,
        baseUrl: document.getElementById('addBaseUrl').value,
        documentationUrl: document.getElementById('addDocUrl').value,
        description: document.getElementById('addDescription').value,
        endpoints: []
      };

      try {
        const res = await fetch('/api/management/apis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('API successfully registered!');
          document.getElementById('addApiForm').reset();
          document.getElementById('testConnectionFeedback').innerText = '';
          switchTab('registry');
        } else {
          alert('Error: ' + (data.error || 'Failed to add API'));
        }
      } catch (err) {
        alert('Submission error: ' + err.message);
      }
    }

    async function handleConsoleSend(e) {
      e.preventDefault();
      const method = document.getElementById('consoleMethod').value;
      const url = document.getElementById('consoleUrl').value;
      const headersRaw = document.getElementById('consoleHeaders').value;
      const btn = document.getElementById('btnConsoleSend');
      const out = document.getElementById('consoleOutput');
      const meta = document.getElementById('consoleMeta');

      let headers = {};
      if (headersRaw.trim()) {
        try {
          headers = JSON.parse(headersRaw);
        } catch {
          alert('Headers must be valid JSON');
          return;
        }
      }

      btn.disabled = true;
      out.innerText = 'Sending request to: ' + url + '...';
      meta.innerText = '';

      try {
        const res = await fetch('/api/management/console/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, headers })
        });
        const data = await res.json();
        if (data.success && data.result) {
          const r = data.result;
          meta.innerText = 'Status: ' + r.statusCode + ' | Latency: ' + r.latencyMs + 'ms';
          out.innerText = (r.bodySnippet || '// Empty body');
        } else {
          out.innerText = 'Error: ' + (data.error || 'Connection failed');
        }
      } catch (err) {
        out.innerText = 'Network error: ' + err.message;
      } finally {
        btn.disabled = false;
      }
    }

    async function loadVaultData() {
      try {
        const res = await fetch('/api/management/vault');
        const data = await res.json();
        if (data.success) {
          const tbody = document.getElementById('vaultTableBody');
          tbody.innerHTML = (data.vault || []).map(v => \`
            <tr>
              <td style="font-family: var(--font-mono); font-weight: 700; color: #f1f5f9;">\${escapeHtml(v.keyName)}</td>
              <td>\${escapeHtml(v.service)}</td>
              <td>
                <span class="badge \${v.status === 'SET' ? 'badge-green' : 'badge-amber'}">\${v.status}</span>
              </td>
              <td style="font-family: var(--font-mono); color: var(--cyan);">\${escapeHtml(v.maskedValue)}</td>
              <td style="color: var(--text-muted); font-size: 0.78rem;">\${escapeHtml(v.description)}</td>
            </tr>
          \`).join('');
        }
      } catch (e) {
        console.error('Error loading vault', e);
      }
    }

    async function loadLogsData() {
      try {
        const status = document.getElementById('logStatusFilter').value;
        const res = await fetch('/api/management/logs?status=' + encodeURIComponent(status));
        const data = await res.json();
        if (data.success) {
          const tbody = document.getElementById('logsTableBody');
          const logs = data.logs || [];
          if (!logs.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No request logs recorded yet. Send queries to populate live telemetry.</td></tr>';
            return;
          }
          tbody.innerHTML = logs.map(l => \`
            <tr>
              <td style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">\${new Date(l.timestamp).toLocaleTimeString()}</td>
              <td><span class="badge badge-blue">\${escapeHtml(l.method)}</span></td>
              <td style="font-family: var(--font-mono);">\${escapeHtml(l.path)}</td>
              <td>
                <span class="badge \${l.statusCode < 400 ? 'badge-green' : l.statusCode < 500 ? 'badge-amber' : 'badge-rose'}">
                  \${l.statusCode}
                </span>
              </td>
              <td style="font-family: var(--font-mono); color: var(--cyan);">\${l.durationMs} ms</td>
              <td style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">\${escapeHtml(l.clientIp)}</td>
            </tr>
          \`).join('');
        }
      } catch (e) {
        console.error('Error loading logs', e);
      }
    }

    async function loadBreakerData() {
      try {
        const res = await fetch('/api/management/circuit-breakers');
        const data = await res.json();
        if (data.success) {
          const tbody = document.getElementById('breakersTableBody');
          tbody.innerHTML = (data.breakers || []).map(b => \`
            <tr>
              <td><strong style="color: #f1f5f9; font-family: var(--font-mono);">\${escapeHtml(b.name)}</strong></td>
              <td><span class="badge \${b.state === 'CLOSED' ? 'badge-green' : b.state === 'HALF_OPEN' ? 'badge-amber' : 'badge-rose'}">\${b.state}</span></td>
              <td style="font-family: var(--font-mono); color: var(--emerald);">\${b.successes}</td>
              <td style="font-family: var(--font-mono); color: \${b.failures > 0 ? 'var(--rose)' : 'var(--text-muted)'};">\${b.failures}</td>
              <td style="font-family: var(--font-mono);">\${b.resetTimeoutMs} ms</td>
              <td>
                <button class="btn btn-secondary btn-sm" onclick="resetBreaker('\${b.name}')">Reset</button>
              </td>
            </tr>
          \`).join('');
        }
      } catch (e) {
        console.error('Error loading circuit breakers', e);
      }
    }

    async function resetBreaker(name) {
      try {
        await fetch('/api/management/circuit-breakers/' + encodeURIComponent(name) + '/reset', { method: 'POST' });
        loadBreakerData();
      } catch (err) {
        alert('Reset error: ' + err.message);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Initial load
    loadOverviewData();
  </script>
</body>
</html>`;
}

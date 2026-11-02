# TERRANEXUS 4D — GEMINI INTEGRATION & SECURITY REPORT
## Architecture, Secret Isolation, Scientific Grounding & Fallback Safeguards

**Platform:** TERRANEXUS 4D  
**Document:** AI Security & Grounded Reasoning Verification  
**Version:** v0.4.0  
**Date:** November 2026  

---

### 1. Architectural Overview & Boundary Isolation

```
Browser Client (React 18 + Vite)
      │
      │ HTTP POST /api/ai/explain (userQuery, applicationContext)
      ▼
Express Backend (Node.js + TypeScript)
      │
      ├─ 1. Rate Limiter (30 requests/minute per client IP)
      ├─ 2. Input Validator (Length: 2-500 chars; Schema Check)
      ├─ 3. Environment Secret Loader (process.env.GEMINI_API_KEY)
      │
      ├─► [Branch A: Key Present & Endpoint Reachable]
      │      │
      │      ├─ Call Google Gen AI SDK (@google/genai v2.32.0)
      │      ├─ System Instruction: 8 Mandatory Grounding Rules
      │      ├─ Model: gemini-2.5-flash (configurable via GEMINI_MODEL)
      │      ├─ Timeout Guard: 15,000 ms Promise.race
      │      └─ Returns: GENUINE_AI_INFERENCE
      │
      └─► [Branch B: Key Absent, Timeout, Rate Exceeded, or Network Down]
             │
             ├─ Activate Deterministic Scientific Rule Engine
             ├─ Formulate Contextual Hydrological & Geological Analysis
             ├─ Embed LaTeX Mass Decoupling Formulas & Aquifer Data
             └─ Returns: DETERMINISTIC_OFFLINE_RULES (Zero Cost)
```

---

### 2. Credential Security & Git Boundary Protection

1. **Strict Server-Side Key Containment:**
   - `GEMINI_API_KEY` is read strictly from `process.env.GEMINI_API_KEY` on the Node.js Express server.
   - The key is **NEVER** injected into Vite client environment variables (`VITE_` prefix is strictly prohibited).
   - The client application never receives, stores, or handles the API key.
2. **Sanitized Logs and Console Outputs:**
   - Server request logs record endpoint hits without printing request bodies or credentials.
   - When errors occur (e.g., quota exhaustion, network timeout), errors are categorized into generic descriptions:
     `[Nexus AI] Gemini API rate limit or quota exceeded. Activating deterministic scientific offline rules.`
   - No stack traces, authorization headers, or URL tokens are output to stdout or stderr.
3. **Repository Cleanliness Check:**
   - `.env` is listed in `.gitignore` and verified by `npm run check:env`.
   - `PRIVATE_CONFIG` and downloaded NASA NetCDF granules in `server/data/raw/` are excluded from tracking.
   - Verification suite `test/test-phase4-suite.ts` audits response serialization to guarantee that strings matching `process.env.GEMINI_API_KEY` or `process.env.EARTHDATA_TOKEN` are never returned in JSON payloads.

---

### 3. Scientific Grounding Rules Enforced via System Instructions

When executing live inference via `@google/genai`, the following system instruction rules are applied:

1. **Platform Context Exclusivity:** The model is instructed to base its conclusions solely on the provided platform telemetry, genuine NASA PO.DAAC satellite records, and official survey frameworks (CGWB NAQUIM, GSI Bhukosh).
2. **Physical Nature of TWSA:** The model must state that GRACE/GRACE-FO Level-3 measures column-integrated Terrestrial Water Storage Anomaly in cm LWE at ~300 km Gaussian smoothing resolution.
3. **Prohibition of Direct Well Depth Equivalence:** The model is strictly prohibited from claiming that GRACE measures single-borewell or village water table depths.
4. **Mass Balance Decoupling:** The model must explicitly highlight the mass balance decoupling equation:
   $$\Delta\text{GWS} = \Delta\text{TWSA} - \Delta\text{SMS} - \Delta\text{SWS} - \Delta\text{SWE}$$
   and the specific yield conversion:
   $$\Delta h_{\text{gw}} = \frac{\Delta\text{GWS}}{S_y}$$
5. **Preservation of Mission Gap:** The model must explicitly recognize the 11-month GRACE to GRACE-FO Mission Gap (July 2017 to May 2018) as an unobserved discontinuity with zero interpolation.
6. **Data Tier Classification:** Outputs must distinguish between `OBSERVED`, `MODELLED`, `PREDICTED`, `SIMULATED`, and `DEMONSTRATION` data tiers.
7. **Surface Optical Limitation:** Sentinel-2 and ASTER spectral alteration indices must be recognized as detecting top-micron surface reflectance only; they cannot prove concealed ore deposits without drilling.
8. **Admission of Insufficient Evidence:** The model must declare lack of evidence rather than fabricating plausible answers when observations are absent.

---

### 4. Robust Rate Limiting, Timeout & Denial-of-Service Defense

1. **IP-Based Sliding Window Limiter:**
   - Implemented in `server/index.ts`.
   - Enforces a threshold of **30 requests per minute** per client IP.
   - Exceeding clients receive `HTTP 429: Too many AI explanation requests. Please wait a moment.`
2. **Query Input Validation:**
   - Queries shorter than 2 characters or longer than 500 characters are rejected with `HTTP 400: Query must be between 2 and 500 characters`.
   - The spatiotemporal context object is verified for valid location and coordinates.
3. **15-Second Timeout Protection:**
   - An asynchronous `Promise.race` combines the Gemini SDK promise with a 15,000 ms timeout timer.
   - If the remote API fails to respond within 15 seconds, the request gracefully switches to the deterministic offline rule engine without crashing the server.

---

### 5. Deterministic Scientific Offline Fallback Engine

To guarantee 100% operational reliability and prevent dependency on external paid services or API quotas, TERRANEXUS 4D features a built-in deterministic offline rule engine:

- **Trigger Scenarios:**
  - `GEMINI_API_KEY` is not configured in `.env`.
  - Upstream network failure or DNS timeout.
  - Rate limiting (HTTP 429) from Google GenAI API.
  - Server latency exceeding 15,000 ms.
- **Engine Capabilities:**
  - Analyzes the active regional locus (e.g., Ludhiana, Khetri, Pune, Zawar, Kolar, Singhbhum, Godavari).
  - Inspects real-time parameters: GRACE linear storage trend (cm/yr), valid observation months (108/132), geological province, depth slice, and aquifer systems.
  - Generates comprehensive markdown output with LaTeX mathematical formulations, CGWB NAQUIM aquifer parameters, specific yields, and scientific limitation alerts.
  - Flags `dataTier: 'DETERMINISTIC_OFFLINE_RULES'` and `isLiveGemini: false`.

---

### 6. Security Audit Summary

| Security Criterion | Validation Method | Result |
|:---|:---|:---:|
| API Key Exposure in Client Code | AST scan of `dist/` and `src/` bundles | **PASSED (Zero Exposure)** |
| API Key Exposure in Network Responses | Serialized JSON payload test in `test-phase4-suite.ts` | **PASSED (Zero Exposure)** |
| Earthdata Token Exposure | AST scan & response audit | **PASSED (Zero Exposure)** |
| Rate Limiter Enforcement | Sequential request bombardment test | **PASSED (HTTP 429 Handled)** |
| Request Timeout Guard | 15s Promise.race simulation | **PASSED (Fallback Triggered)** |
| Git Boundary Security | `npm run check:env` & git status audit | **PASSED (Untracked .env)** |
| Zero Paid Service Dependency | Offline fallback verification test | **PASSED (100% Functional)** |

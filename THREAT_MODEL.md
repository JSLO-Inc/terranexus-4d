# TERRANEXUS 4D — THREAT MODEL (STRIDE METHODOLOGY)
**Target Platform:** TERRANEXUS 4D (National Subsurface Intelligence & Earth Digital Twin)  
**Methodology:** Microsoft STRIDE Threat Modeling Framework  
**Scope:** Client Browser (React/CesiumJS), Backend Server (Express/Node.js), Ingestion Engine, Local File System, External APIs (NASA, OSM, Google Gemini).

---

## 1. System Architecture & Trust Boundaries

```
[ BROWSER CLIENT (Untrusted) ]
       │
       │ HTTP / JSON (CORS Restricted, Rate Limited)
       ▼
[ EXPRESS BACKEND SERVER (Trusted Core) ]
       ├── [ Security Headers & Rate Limiting Middleware ]
       ├── [ SSRF Validator (urlValidator.ts) ]
       ├── [ Path Traversal Guard (pathGuard.ts) ]
       ├── [ Central Provider Registry (providerRegistry.ts) ]
       │
       ├──► [ LOCAL STORAGE: server/data/raw, processed, cache ]
       │
       ├──► [ NASA CMR / PO.DAAC API (Authenticated with EARTHDATA_TOKEN) ]
       ├──► [ OpenStreetMap Nominatim (Rate Limited: 1 req/sec) ]
       └──► [ Google Gemini AI API (Server-Side GEMINI_API_KEY) ]
```

---

## 2. STRIDE Threat Analysis & Implemented Mitigations

### 2.1 Spoofing (Identity & Origin)
- **Threat:** Malicious client claims to be a trusted frontend origin to abuse API endpoints or extract proprietary models.
- **Vulnerability:** Unrestricted CORS (`cors()`) allowing `*`.
- **Implemented Mitigation:** `originGuard.ts` restricts allowed origins strictly to authorized local development and internal domains (`http://localhost:3000`, `http://localhost:5173`, `http://127.0.0.1:3000`). Preflight responses are cached for 24 hours.

### 2.2 Tampering (Data Manipulation & File Overwrites)
- **Threat:** Attacker uses file upload or granule download endpoints to write arbitrary files to the server file system or overwrite source code (`../../server/index.ts`).
- **Vulnerability:** Unsanitized filenames accepted in request bodies.
- **Implemented Mitigation:** `pathGuard.ts` enforces path boundary validation using `path.resolve()`, ensuring target paths cannot escape designated storage roots (`server/data/raw/`). Strips traversal tokens (`..`, `/`, `\`) and restricts file extensions to an approved whitelist (`.nc`, `.json`, `.csv`, `.txt`, `.geojson`).

### 2.3 Repudiation (Traceability & Provenance)
- **Threat:** Fabricated or corrupt scientific data is introduced into the system without traceable origin, leading to scientific malpractice or incorrect mineral/water assessments.
- **Implemented Mitigation:** Mandatory cryptographic provenance. Every downloaded raw file generates an immutable `.provenance.json` sidecar capturing SHA-256 hash, byte size, source URL, download timestamp, and NetCDF magic byte verification (`\x89HDF\r\n\x1a\n`). The system displays provenance metadata transparently in the UI.

### 2.4 Information Disclosure (Credential Leaks & Path Traversal)
- **Threat:** Attacker probes endpoints to extract server private keys, NASA Earthdata tokens, Google Gemini API keys, or cloud instance metadata (AWS IMDS).
- **Vulnerability:** SSRF via `/api/hydro/nasa/download` allowing outbound requests to `http://169.254.169.254`.
- **Implemented Mitigation:**
  - `urlValidator.ts` blocks all private IP ranges (`169.254.0.0/16`, `127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`) and enforces an approved scientific domain whitelist.
  - Zero private credentials exist in frontend bundles (`VITE_` variables contain no backend keys).
  - Backend error responses sanitize internal stack traces and server paths.
  - Automated CI script `check-config.ts` masks all tokens in terminal and prevents `.env` staging.

### 2.5 Denial of Service (Resource Exhaustion)
- **Threat:** Automated scripts flood the location search, zonal statistics, or NetCDF parser endpoints to exhaust CPU, RAM, or bandwidth.
- **Implemented Mitigation:**
  - Multi-tier sliding-window rate limiters (`rateLimiter.ts`):
    - General API: 180 requests/minute.
    - Location Search: 90 requests/minute.
    - Ingestion & Download: 15 requests/minute.
    - AI Reasoning: 30 requests/minute.
  - Express JSON payload size strictly limited to `1mb` (`express.json({ limit: '1mb' })`).
  - OpenStreetMap Nominatim queries cached in memory with a built-in offline index of 36 States/UTs to minimize external network requests.

### 2.6 Elevation of Privilege
- **Threat:** Attacker passes executable code or malicious NetCDF binaries that exploit native C/C++ libraries (e.g. `libnetcdf` or Python `h5py`).
- **Implemented Mitigation:**
  - Strict binary signature verification: NetCDF files must possess genuine HDF5 (`\x89HDF\r\n\x1a\n`) or NetCDF-3 (`CDF\x01`) magic headers before parsing.
  - File size bounds enforcement (maximum 500 MB).
  - Executable permissions are stripped from data directories. Downloaded files are never executed as code.

---

## 3. Residual Risks & Recommended Future Hardening

1. **Self-Hosted Geocoding:** Currently, place searches use Nominatim with local offline index fallbacks. In future phases, deploying an offline Pelias or Photon instance will eliminate external network dependency entirely.
2. **Containerized Ingestion:** While path traversal is prevented in code, deploying the ingestion engine in an isolated Docker container with a read-only root file system provides secondary defense-in-depth.

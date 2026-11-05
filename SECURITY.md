# Security Policy — TERRANEXUS 4D

## Supported Versions

| Version | Supported          | Security Maintenance Status |
| ------- | ------------------ | --------------------------- |
| 0.1.x   | :white_check_mark: | Active                      |
| < 0.1.0 | :x:                | End of Life                 |

---

## Reporting a Vulnerability

We take the security and integrity of **TERRANEXUS 4D — India's Unified Earth Intelligence Platform** seriously.

If you discover a security vulnerability, potential data exposure, or server-side risk, please report it privately:

1. **GitHub Private Vulnerability Reporting (Preferred):**  
   Navigate to the repository's **Security** tab and click **Report a vulnerability**.
2. **Security Contact Email:**  
   Send an encrypted or private report to `security@terranexus.internal`.

### What to Include in Your Report
- A description of the vulnerability and its potential impact.
- Step-by-step instructions or proof-of-concept scripts to reproduce the issue.
- The affected component, file, or endpoint (e.g. `server/security/urlValidator.ts`, `/api/location-dossier`).
- Any suggested remediation or patches if available.

### Disclosure Policy
- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide regular status updates during investigation and patch development.
- Please allow a reasonable disclosure window (typically 30–90 days) before publicly disclosing any vulnerability.

---

## Security Architecture & Defenses

TERRANEXUS 4D enforces defense-in-depth across the entire stack:

### 1. Zero Client-Side Secret Exposure
- All third-party satellite and AI credentials (`GEMINI_API_KEY`, `EARTHDATA_TOKEN`, `SENTINEL_HUB_CLIENT_SECRET`) reside strictly in server-side environment variables.
- Zero API keys are bundled into frontend client code (`src/`).

### 2. Industrial SSRF & DNS Rebinding Protection
- All outbound satellite queries are mediated through `server/security/urlValidator.ts`.
- The engine enforces strict domain whitelisting, resolves DNS before dispatch, blocks private/loopback/link-local/multicast IP addresses (including hex/octal/decimal obfuscation), and validates every redirect hop manually (`redirect: 'manual'`).

### 3. Path Traversal Defense
- All local file lookups (NetCDF, CSV, DEM geotiffs) are validated through `server/security/pathGuard.ts`.
- Traversal sequences (`../`, `..\\`, encoded null bytes) are stripped and verified against allowed asset roots.

### 4. HTTP Headers & CORS Perimeter
- `server/security/originGuard.ts` strictly validates `Origin` and `Referer` headers against allowed origins.
- `server/security/securityHeaders.ts` injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and restrictive `Content-Security-Policy`.

### 5. Multi-Tier Rate Limiting
- `server/security/rateLimiter.ts` implements in-memory sliding-window rate limiters per client IP to mitigate denial-of-service and brute-force scans.

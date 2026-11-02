# TERRANEXUS 4D — SECURITY INCIDENT RESPONSE PLAN
**Document Version:** 1.0.0  
**Effective Date:** 2026-11-02  
**Target Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)

---

## 1. Incident Response Lifecycle

TERRANEXUS 4D adheres to the NIST SP 800-61 Rev. 2 Computer Security Incident Handling Guide:

```
[ 1. PREPARATION ] ──► [ 2. DETECTION & ANALYSIS ] ──► [ 3. CONTAINMENT ]
                              ▲                                │
                              │                                ▼
                     [ 5. POST-INCIDENT ] ◄── [ 4. ERADICATION & RECOVERY ]
```

---

## 2. Threat Playbooks

### Playbook A: Accidental Credential Exposure
*Scenario: An API key or token is accidentally detected in Git commits or terminal output.*

1. **Immediate Containment (< 5 minutes):**
   - Invalidate the compromised token immediately at the provider's portal:
     - Google AI Studio: Revoke `GEMINI_API_KEY`.
     - NASA Earthdata: Revoke `EARTHDATA_TOKEN`.
2. **Eradication:**
   - If committed to Git, use `git filter-repo` or BFG Repo-Cleaner to purge the commit from local and remote Git history.
   - Force-pushing cleaned history is only permitted with explicit repository owner sign-off.
3. **Recovery:**
   - Generate a replacement token.
   - Update the local `.env` file.
   - Run `npm run check:env` to verify masked detection.
4. **Post-Incident Review:**
   - Audit `.gitignore` and pre-commit hooks to verify why the file was staged.

---

### Playbook B: Server-Side Request Forgery (SSRF) Probe
*Scenario: Attacker attempts to probe cloud metadata (`169.254.169.254`) or internal ports via `/api/hydro/nasa/download`.*

1. **Detection:**
   - Server logs indicate `SSRF_SECURITY_REJECTION` with a 400 Bad Request code.
2. **Containment:**
   - Outbound request is blocked automatically by `urlValidator.ts` before socket creation.
   - The originating client IP is throttled by `rateLimiter.ts`.
3. **Analysis:**
   - Inspect server logs to determine the targeted URL, payload structure, and requesting IP address.
   - Confirm that zero network connections were established to the target IP.
4. **Hardening:**
   - Add new malicious host patterns or IP ranges to `urlValidator.ts` if novel attack patterns are discovered.

---

### Playbook C: Path Traversal Attack
*Scenario: Attacker attempts to pass `../../etc/passwd` or `..\..\Windows\System32` in the `filename` parameter.*

1. **Detection:**
   - Server logs indicate `PATH_TRAVERSAL_REJECTION`.
2. **Containment:**
   - File system handler rejects the request before executing `fs.readFile` or `fs.writeFile`.
3. **Analysis:**
   - Verify that the target path resolved outside the designated storage root (`server/data/raw/`).
   - Confirm that no files were written, modified, or deleted.

---

### Playbook D: Corrupted or Malicious Satellite Dataset Injection
*Scenario: A downloaded or supplied NetCDF file contains unexpected bytes, shellcode, or malformed HDF5 headers.*

1. **Detection:**
   - Binary signature verification fails in `verifyNetcdfSignature()`.
   - File size is below 1 KB or exceeds 500 MB.
2. **Containment:**
   - File is immediately isolated in `server/data/raw/` and marked `INVALID_SIGNATURE`.
   - Execution is aborted before invoking Python NetCDF-4 or HDF5 native parsers.
3. **Eradication:**
   - Delete the corrupted file.
   - Log the remote URL and HTTP response status.

---

## 3. Incident Severity Levels

| Severity | Definition | Target Resolution Time | Action Required |
| :--- | :--- | :--- | :--- |
| **P1 - CRITICAL** | Active secret leak in public GitHub repository; remote code execution vulnerability. | < 1 hour | Immediate credential revocation, repo lockdown, emergency hotfix. |
| **P2 - HIGH** | SSRF or path traversal vulnerability in active API route; high-volume DoS attack. | < 4 hours | Route patch, rate-limit tightening, test suite execution. |
| **P3 - MEDIUM** | Deprecated package advisory without known exploit in dev server; rate limit bypass. | < 24 hours | Dependency review, middleware update. |
| **P4 - LOW** | Minor documentation discrepancy or cosmetic logging issue. | Next release | Standard development queue. |

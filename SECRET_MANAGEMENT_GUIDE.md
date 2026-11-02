# TERRANEXUS 4D — SECRET AND CREDENTIAL MANAGEMENT GUIDE
**Document Version:** 1.0.0  
**Effective Date:** 2026-11-02  
**Target Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)

---

## 1. Core Principles of Secret Management

1. **Zero Git Tracking:** No secret, token, password, or private configuration may ever be committed to Git.
2. **Server-Side Exclusivity:** All sensitive credentials (`GEMINI_API_KEY`, `EARTHDATA_TOKEN`, `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`) reside exclusively in backend server memory.
3. **Frontend Isolation:** Client-side React code (`src/`) must never reference backend secrets. `VITE_` variables in frontend builds are public by definition and must contain only public endpoints or non-sensitive configuration.
4. **Zero-Log Redaction:** Application logs, error messages, and terminal outputs must mask all secret values (e.g. `AQ....********...wqA`).
5. **Safe Automated Verification:** Run `npm run check:env` to audit local configuration without exposing credentials.

---

## 2. Configuration File Structure

The project uses a two-tier configuration structure:

| File | Purpose | Git Tracking | Sensitivity |
| :--- | :--- | :--- | :--- |
| **`.env.example`** | Public template containing empty variable placeholders and configuration guidance. | **TRACKED IN GIT** | Public (Zero secrets) |
| **`.env`** | Local private environment file containing genuine user tokens and keys. | **STRICTLY IGNORED** | Confidential (Local only) |

### 2.1 Sample `.env.example`
```env
# SERVER & API PORTS
PORT=3001
VITE_API_URL=http://localhost:3001

# AI REASONING (Google Gemini)
# Obtain free API key from https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# NASA EARTHDATA & PO.DAAC SATELLITE ACCESS
# Obtain free token from https://urs.earthdata.nasa.gov/
EARTHDATA_TOKEN=your_earthdata_bearer_token_here
EARTHDATA_USERNAME=
EARTHDATA_PASSWORD=

# CESIUM 3D GLOBE (Optional — defaults to OpenStreetMap/Sentinel open imagery)
VITE_CESIUM_ION_TOKEN=
```

---

## 3. Pre-Commit Verification Workflow

Before executing any Git commit:

1. **Run the Automated Config Auditor:**
   ```powershell
   npm run check:env
   ```
   *Guarantees that `.env` is ignored, masks secret values, and verifies `.gitignore` rules.*

2. **Inspect Staged Files Explicitly:**
   ```powershell
   git status
   ```
   *Never execute `git add .` or `git add -A` blindly. Stage only vetted files explicitly.*

3. **Verify Git Staging Boundary:**
   ```powershell
   git diff --staged --name-only
   ```
   *Ensure that no `.env`, `.pem`, `.key`, or credentials files appear in the list.*

---

## 4. Secret Rotation and Revocation Procedure

In the event that an API key or token is suspected of compromise:

1. **Immediate Revocation:**
   - **Google Gemini API Key:** Access [Google AI Studio API Keys](https://aistudio.google.com/app/apikey), locate the compromised key, and click **Delete**. Generate a new replacement key.
   - **NASA Earthdata Token:** Access [NASA Earthdata Profile](https://urs.earthdata.nasa.gov/users/tokens), revoke the active bearer token, and generate a new token.
2. **Local Environment Update:**
   - Open `.env` locally.
   - Replace the revoked credential with the newly generated key.
   - Save `.env`.
3. **Verify Masked Detection:**
   - Execute `npm run check:env` to confirm the new key is detected and masked.
4. **Restart Server:**
   - Terminate the active dev server task and restart with `npm run dev`.

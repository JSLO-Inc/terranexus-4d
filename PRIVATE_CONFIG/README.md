# PRIVATE CONFIGURATION & CREDENTIAL MANAGEMENT GUIDE
**TERRANEXUS 4D — Confidential Configuration & Security Documentation**

Welcome to the **TERRANEXUS 4D Private Configuration Hub**. This folder is designed specifically to help you manage sensitive keys, passwords, private data sources, and cloud credentials safely without risking exposure to GitHub or public repositories.

---

## 1. What This Folder Is For

This folder (`PRIVATE_CONFIG/`) serves as your **central reference manual** for:
- Understanding every configuration setting used across TERRANEXUS 4D.
- Registering public and private data sources.
- Following simple, step-by-step guides to configure your local environment.
- Learning how to protect your personal accounts, API keys, and private data from accidental leaks.

> [!IMPORTANT]
> **This folder contains templates and instructions only.**
> Never paste actual API keys, passwords, bearer tokens, or private URLs directly into markdown files in this directory. All actual secret values belong exclusively in your local `.env` file at the root of the project.

---

## 2. Where You Should Add Private Information

All private information belongs in exactly **one place**:

```
d:\Terranexus 4d\.env
```

The `.env` file lives in the root directory of your project. It is:
1. **Strictly Local:** Exists only on your local computer.
2. **Ignored by Git:** Protected by `.gitignore` so Git will never track, commit, or push it.
3. **Loaded by Backend:** Automatically read by Node.js and Python when the platform starts.
4. **Never Sent to the Browser:** Kept on the server side so client-side browsers cannot inspect it.

---

## 3. Which Information Must Remain Private

Treat the following items as strictly confidential:

| Category | Examples | Why It Must Be Kept Private |
| :--- | :--- | :--- |
| **NASA Earthdata Tokens** | `EARTHDATA_TOKEN`, User Tokens | Grants access to your personal NASA profile and cloud downloads. |
| **Passwords & Logins** | `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`, `.netrc` | Direct credentials to your Earthdata account. |
| **AI Copilot Keys** | `GEMINI_API_KEY`, OpenAI keys | Grants access to your Google AI Studio account and usage quotas. |
| **Mapping Tokens** | `VITE_CESIUM_ION_TOKEN`, Mapbox tokens | Tied to your personal mapping account and monthly tile bandwidth. |
| **Authenticated URLs** | Presigned S3 links (`X-Amz-Signature`), private download tokens | Temporary access links that bypass login walls. |
| **Private Data Files** | Unreleased drill-core data, proprietary mining logs | Sensitive or proprietary scientific data. |
| **Database & Server Settings** | Connection strings, port forwarding secrets, SSH keys | Server infrastructure access. |

---

## 4. How to Add a New API Key (Beginner's 5-Step Process)

You do **not** need to modify application source code to add a new API key. Follow these five simple steps:

### Step 1: Add a placeholder to `.env.example`
Open `.env.example` and add your variable with an empty value so collaborators know it exists:
```bash
MY_NEW_SERVICE_KEY=
```

### Step 2: Add your real secret to `.env`
Open your local `.env` file and paste your actual secret:
```bash
MY_NEW_SERVICE_KEY=ab123456789xyz_your_actual_key
```

### Step 3: Document the setting in `PRIVATE_SETTINGS.md`
Open [`PRIVATE_SETTINGS.md`](file:///d:/Terranexus%204d/PRIVATE_CONFIG/PRIVATE_SETTINGS.md) and add a short section explaining:
- What the key is for.
- Where a user can get a free key.
- Whether it is required or optional.

### Step 4: Validate your configuration
Run the built-in configuration security validator:
```bash
npm run check:env
```
The validator will display your new key as `✓ CONFIGURED` with a safe, masked preview (no raw secrets printed).

### Step 5: Restart the server
Restart your backend server to load the new setting:
```bash
npm run dev
```

---

## 5. How to Add a New Data-Source URL

When integrating a new data source (e.g., state water board telemetry, weather radar, or satellite imagery):

1. **Classify the URL:**
   - **Public URL:** Open catalogue links, public documentation, or unauthenticated OpenSearch endpoints (e.g. `https://cmr.earthdata.nasa.gov/search`). These are safe to put in [`DATA_SOURCES.md`](file:///d:/Terranexus%204d/PRIVATE_CONFIG/DATA_SOURCES.md).
   - **Private / Authenticated URL:** Any URL containing a personal API key, user token, or presigned signature query string (e.g. `?token=...` or `?X-Amz-Signature=...`). **These must never be written in documentation.**
2. **Configure Private URLs in `.env`:**
   Add private endpoints to `.env` using environment variables (e.g., `ADDITIONAL_PRIVATE_URL=https://private-geoserver.local/wms`).
3. **Register the Source in `DATA_SOURCES.md`:**
   Add the provider, dataset identifier, and public reference link to [`DATA_SOURCES.md`](file:///d:/Terranexus%204d/PRIVATE_CONFIG/DATA_SOURCES.md).

---

## 6. How to Update Credentials

When you generate a new token or your password changes:

1. Open `.env` in your text editor (VS Code, Notepad, etc.).
2. Replace the old value with your new token.
3. Save the `.env` file.
4. Run `npm run check:env` to verify the new token length and status.
5. If running `npm run dev`, restart the terminal process so the backend reads the updated environment.

---

## 7. How to Check Whether a Credential Is Working

TERRANEXUS 4D provides two automated tools to verify your credentials without revealing them:

### Tool A: Local Configuration Auditor
Checks that `.env` is loaded, variables are populated, and `.gitignore` is secure:
```bash
npm run check:env
```

### Tool B: NASA Pipeline Integration Test
Performs a live authentication handshake with NASA PO.DAAC:
```bash
npm run test:nasa
```
- If your token is valid and authorized, Category 8 will report:
  `✓ PASS: Successfully downloaded genuine NASA NetCDF`
- If your token requires PO.DAAC application authorization, it will report:
  `[AUTHENTICATION BARRIER DETECTED: INVALID_CREDENTIALS]` with exact steps to authorize the app.

---

## 8. How to Avoid Accidentally Uploading Private Information

To guarantee that private credentials are never pushed to GitHub:

1. **Rely on `.gitignore`:**
   Your `.gitignore` file is pre-configured to automatically block `.env`, `PRIVATE_CONFIG/*`, `*.pem`, `*.key`, `credentials.json`, and all raw data downloads.
2. **Never Use `git add .` Blindly:**
   Instead of staging everything with `git add .`, stage specific files by name (e.g., `git add src/App.tsx server/index.ts`).
3. **Always Check Staged Files Before Committing:**
   Run:
   ```bash
   git status
   ```
   Look at the green files listed under "Changes to be committed". If you see `.env` or any sensitive file, unstage it immediately with:
   ```bash
   git restore --staged <filename>
   ```
4. **Inspect Diffs Before Committing:**
   Run:
   ```bash
   git diff --staged
   ```
   Verify that no API keys or passwords are present in your changes.
5. **If You Ever Commit a Secret Accidental:**
   - **Immediately Revoke It:** Go to the provider's website (e.g. Google AI Studio, NASA Earthdata) and delete/regenerate the key immediately. Simply deleting the file or making a second commit does not remove the secret from Git history!
   - Contact your team or follow Git history sanitization procedures (using tools like `git-filter-repo`).

---

## 9. Table of Reference Documents in This Folder

- [`PRIVATE_SETTINGS.md`](file:///d:/Terranexus%204d/PRIVATE_CONFIG/PRIVATE_SETTINGS.md): Complete catalog of all supported environment variables, their purpose, and how to configure them.
- [`DATA_SOURCES.md`](file:///d:/Terranexus%204d/PRIVATE_CONFIG/DATA_SOURCES.md): Registry of all satellite, telemetry, and geological data sources integrated into TERRANEXUS 4D.
- [`LOCAL_SETUP_GUIDE.md`](file:///d:/Terranexus%204d/PRIVATE_CONFIG/LOCAL_SETUP_GUIDE.md): Beginner's walkthrough to install, configure, and test the platform from scratch on your local computer.

# LOCAL SETUP & CONFIGURATION GUIDE FOR BEGINNERS
**TERRANEXUS 4D — Step-by-Step Installation, Secret Management & Local Deployment**

This guide is designed for beginners. It walks you through setting up TERRANEXUS 4D on your local computer, configuring optional API keys safely, and verifying that no private credentials will ever be uploaded to GitHub.

---

## 1. Prerequisites

Before starting, ensure your computer has the following tools installed:

1. **Node.js (v20 or newer):**
   - Verify installation: Open PowerShell or Command Prompt and run:
     ```bash
     node --version
     ```
   - If not installed, download the LTS version from: [https://nodejs.org/](https://nodejs.org/)
2. **Python (v3.12 or newer):**
   - Verify installation:
     ```bash
     python --version
     ```
   - If not installed, download from: [https://www.python.org/](https://www.python.org/)
3. **`uv` Fast Python Package Manager:**
   - Used by the scientific NetCDF parser to run Python scripts with sandboxed dependencies.
   - Verify installation:
     ```bash
     uv --version
     ```
   - If not installed, install it in PowerShell:
     ```powershell
     powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
     ```

---

## 2. Step 1: Clone the Repository & Install Dependencies

Open PowerShell, navigate to your workspace folder, and install the Node.js packages:

```powershell
# Navigate to project folder
cd "d:\Terranexus 4d"

# Install dependencies (only takes ~15 seconds)
npm install
```

---

## 3. Step 2: Create Your Local Private `.env` File

The repository includes a public template file named `.env.example`. You must copy it to create your private `.env` file:

```powershell
# On Windows PowerShell:
Copy-Item .env.example .env

# (Or on macOS / Linux):
# cp .env.example .env
```

> [!IMPORTANT]
> The `.env` file you just created is **strictly local** and is pre-configured in `.gitignore`. Git will never track or upload this file to GitHub.

---

## 4. Step 3: Configure Your Optional Credentials (Free Accounts)

TERRANEXUS 4D works out-of-the-box with built-in scientific benchmark data even without any API keys. However, if you wish to unlock live generative AI explanations, 3D terrain, or authentic NASA satellite downloads, follow these guides:

### A. Google Gemini API Key (NEXUS AI Copilot)
*Enables live multimodal AI explanations of subsurface strata and water levels.*

1. Open your browser and go to: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google Account.
3. Click the blue **Get API key** button on the left navigation bar.
4. Click **Create API key** → choose **Create key in new project**.
5. Copy the generated key string (starts with `AIzaSy...`).
6. Open `.env` in VS Code or Notepad and paste it:
   ```bash
   GEMINI_API_KEY=your_copied_gemini_key_here
   ```

---

### B. Cesium Ion Access Token (3D Geospatial Globe)
*Enables 3D global terrain relief and high-resolution aerial imagery.*

1. Open your browser and go to: [https://cesium.com/ion/](https://cesium.com/ion/)
2. Click **Sign In** → **Sign Up** to create a free community account.
3. Once logged in, click **Access Tokens** in the navigation bar.
4. Copy the default token provided.
5. In your `.env` file, paste it:
   ```bash
   VITE_CESIUM_ION_TOKEN=your_copied_cesium_token_here
   ```

---

### C. NASA Earthdata Login & PO.DAAC Authorization (Genuine Satellite Ingestion)
*Enables downloading genuine NASA GRACE and GRACE-FO NetCDF-4 satellite data.*

NASA data is 100% free and open, but NASA requires a free registered account and application authorization before allowing downloads from its AWS cloud archive:

1. **Register a free account:**
   Go to [https://urs.earthdata.nasa.gov/users/new](https://urs.earthdata.nasa.gov/users/new) and fill out the registration form.
2. **Crucial Step: Authorize the "PO.DAAC Cloud" Application:**
   - Log in to your Earthdata profile at: [https://urs.earthdata.nasa.gov/profile](https://urs.earthdata.nasa.gov/profile)
   - In the left sidebar, click **Applications** → **Authorized Apps**.
   - Click the green **Approve More Applications** button.
   - In the search bar, type `PO.DAAC` and select **PO.DAAC Cloud** (or **NASA PO.DAAC**).
   - Click **Authorize / Approve**.
3. **Generate Your Bearer Token:**
   - In your Earthdata profile, click **Generate Token** (or **User Tokens**).
   - Click **Generate New Token**.
   - Copy the long token string (begins with `eyJ...`).
4. **Paste Into `.env`:**
   In your `.env` file, paste the token:
   ```bash
   EARTHDATA_TOKEN=your_copied_token_here
   ```

---

## 5. Step 4: Verify Your Configuration (Without Exposing Secrets)

TERRANEXUS 4D includes an automated security auditor tool that checks your settings without ever printing your secrets:

```powershell
npm run check:env
```

Expected output:
```
[1. File Presence & Git Boundary Check]
  .env file present:       ✓ YES (Local-only)
  .env.example present:   ✓ YES (Public template)
  .gitignore present:     ✓ YES

[2. Git Protection Rule Verification]
  .env protected from Git:          ✓ SECURE
  PRIVATE_CONFIG protected:         ✓ SECURE
  Raw satellite data protected:     ✓ SECURE

[3. Environment Variables Status & Security Audit]
--------------------------------------------------------------------------------
Variable Name           Category      Status            Safe Value Preview (NO SECRETS)
--------------------------------------------------------------------------------
PORT                    CORE          ✓ CONFIGURED      3001
VITE_API_URL            CORE          ✓ CONFIGURED      http://localhost:3001
GEMINI_API_KEY          AI            ✓ CONFIGURED      AIz...********...45a (39 chars)
VITE_CESIUM_ION_TOKEN   3D_MAP        ✓ CONFIGURED      eyJ...********...91b (184 chars)
EARTHDATA_TOKEN         NASA_DATA     ✓ CONFIGURED      eyJ...********..._dQ (696 chars)
--------------------------------------------------------------------------------
```

Notice that your actual keys are safely masked (`AIz...********...45a`) and never exposed in full.

---

## 6. Step 5: Run the Verification Tests

Before launching the application, run the automated test suite to ensure all components are healthy:

```powershell
# 1. Run NASA pipeline test suite (verifies CMR discovery, authentication, coordinate calculations)
npm run test:nasa

# 2. Run ingestion regression suite (2,285 assertions)
npm run test:ingestion

# 3. Run platform system audit (231 assertions)
npm test

# 4. Check TypeScript types
npm run lint
```

All tests should pass with 0 errors.

---

## 7. Step 6: Start the Development Server

To start both the Express backend and Vite frontend simultaneously:

```powershell
npm run dev
```

- **Backend:** Starts on [http://localhost:3001](http://localhost:3001)
- **Frontend:** Starts on [http://localhost:5173](http://localhost:5173)

Open your web browser and navigate to:
**[http://localhost:5173](http://localhost:5173)**

Explore:
- **Nexus Subsurface:** 3D geological strata slices down to -1000m.
- **Nexus Hydro:** Satellite groundwater storage anomaly trends and monitoring well dipping telemetry.
- **Nexus Ore:** Surface mineral alteration spectral indices and gossan ratios.
- **Nexus AI:** Grounded geological AI assistant (bottom drawer).

---

## 8. Safe Git Workflow Checklist (Preventing Leaks Before Committing)

Before ever running `git commit` or `git push`:

1. **Check What Is Staged:**
   ```powershell
   git status
   ```
   Examine every file under "Changes to be committed".
2. **Never Use `git add .`:**
   Stage only the specific code or documentation files you worked on:
   ```powershell
   git add src/components/MyComponent.tsx
   ```
3. **Double Check with Diff:**
   ```powershell
   git diff --staged
   ```
   Ensure no API keys, tokens, or personal paths are in the diff.
4. **Commit Safely:**
   ```powershell
   git commit -m "feat: your meaningful commit message"
   ```
5. **If You Ever Accidentally Stage `.env`:**
   Unstage it immediately:
   ```powershell
   git restore --staged .env
   ```

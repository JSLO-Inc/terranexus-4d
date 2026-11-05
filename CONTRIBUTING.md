# Contributing to TERRANEXUS 4D

Thank you for your interest in contributing to **TERRANEXUS 4D — India's Unified Earth Intelligence Platform**.

We welcome contributions from hydrogeologists, geophysicists, remote sensing specialists, software engineers, and geospatial data scientists. Because this platform is dedicated to scientific credibility and public research, all contributions must uphold rigorous standards of data integrity and code quality.

---

## 1. Code of Scientific Integrity

The most critical principle of TERRANEXUS 4D is that **we never fabricate scientific data and never label synthetic or regional models as live observations**.

When contributing code or data adapters:
1. **Never conflate tiers:**
   - **`OBSERVED`**: Direct physical in-situ measurements (e.g. dip-meter well readings, drill core lithology).
   - **`DERIVED`**: Derived from authoritative spatial datasets (e.g. Copernicus DEM elevation, HydroSHEDS drainage).
   - **`MODELLED`**: Mathematical or statistical models (e.g. GSI prospectivity, recharge index).
   - **`REGIONAL_AGGREGATION`**: Macro statistics compiled over administrative boundaries (e.g. GEC-2015 state-level totals). Must carry explicit disclaimers that they do not represent point borehole measurements.
   - **`UNAVAILABLE`**: When data does not exist, explicitly declare it unavailable. Never fill missing data with invented values.
2. **Satellite Optics Physical Limitations:** Optical and SWIR sensors (Sentinel-2, Landsat, ASTER) measure surface reflectance from the top micrometers only. They cannot penetrate rock to detect deep ore bodies. Never describe surface spectral indices as confirming underground reserves.
3. **Gravity Footprint Limitations:** NASA GRACE gravimetry measures regional anomalies over $\sim 300\,\text{km}$ Gaussian filter footprints. Never present GRACE TWSA as local borehole-level water depth.
4. **Boundary Isolation:** Station nearest-neighbor searches must enforce state and territorial boundaries. Never link coordinates to distant monitoring stations across state lines without clear spatial gating.

---

## 2. Development Setup

### Prerequisites
- **Node.js**: v18.0.0+ or v20.0.0+
- **npm**: v9.0.0+ or v10.0.0+
- **Git**

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/JSLO-Inc/terranexus-4d.git
cd terranexus-4d

# 2. Install dependencies
npm install

# 3. Configure local environment
cp .env.example .env

# 4. Start development servers (Express API on :3001, Vite React on :3000)
npm run dev
```

---

## 3. Pre-Pull Request Verification

Before opening a pull request, your branch must satisfy all quality and regression gates:

```bash
# 1. Verify TypeScript types (Zero errors required)
npm run lint

# 2. Run the complete automated test suite (All 18 test suites must pass, 3,520 assertions)
npm run test:all

# 3. Verify production build bundle
npm run build
```

---

## 4. Security Rules

- **Zero Secret Commits:** Never commit API keys (`GEMINI_API_KEY`, `EARTHDATA_TOKEN`), passwords, tokens, or personal identifiers.
- **`.env` Protection:** `.env` is strictly gitignored. Never force-add `.env` or any credential files.
- **Path Sanitization:** All file I/O operations must validate filenames through `server/security/pathGuard.ts` to prevent directory traversal.
- **Outbound Host Validation:** Any external HTTP request must validate remote hosts against `server/security/urlValidator.ts`.

---

## 5. Licensing

By contributing to TERRANEXUS 4D, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

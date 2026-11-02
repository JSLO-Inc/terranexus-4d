# TERRANEXUS 4D — DATA RETENTION AND PRIVACY POLICY
**Document Version:** 1.0.0  
**Effective Date:** 2026-11-02  
**Target Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)  
**Regulatory Alignment:** Digital Personal Data Protection (DPDP) Act 2023 (India), OWASP Privacy Principles.

---

## 1. Privacy Principles

TERRANEXUS 4D is engineered on the principle of **Data Minimization and Zero Unnecessary Collection**:
- The platform is a scientific geospatial exploration tool, not a personal data harvester.
- We do not require user accounts, phone numbers, email addresses, or personal tracking cookies to explore Indian subsurface geology or groundwater.
- We do not sell, license, or monetize search queries or geographic interest patterns.

---

## 2. Categories of Data Handled

| Data Category | Description | Storage Location | Retention Period | Deletion Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Geographic Searches** | Place names, coordinates, or DMS strings entered into the search bar. | Browser memory & transient server LRU cache. | Maximum 24 hours in server LRU cache. | Cleared on server restart or browser session reload. |
| **Scientific Satellite Data** | Raw NetCDF files from NASA PO.DAAC (`server/data/raw/`). | Local storage only. | Permanent local archive unless user clears cache. | Manual directory deletion by user. |
| **Processed Spatial Data** | Extracted time series and zonal statistics (`server/data/processed/`). | Local storage only. | Retained for rapid offline query performance. | Manual directory deletion by user. |
| **AI Query Prompts** | Questions asked by the user in Nexus AI. | Transmitted ephemerally to Gemini API via HTTPS. | Not persisted on local disk or database. | Ephemeral session lifetime. |
| **Session Diagnostics** | Server console logs and rate limit IP maps. | In-memory sliding window. | 60 seconds (rate limiter window) / transient console buffer. | Automatic sliding window eviction. |

---

## 3. Nexus AI & Gemini Data Transmission Policy

When a user submits a query to Nexus AI (`/api/ai/explain`):

1. **Information Sent:**
   - User query text (e.g., "What is the groundwater depletion trend here?").
   - Location macro-context: State, District, Elevation, River Basin, Geological Terrane.
   - Aggregate scientific metrics: Decadal GRACE TWSA trend ($\text{cm/yr}$), CGWB stage of extraction ($\%$), representative rock formations.
2. **Information NOT Sent:**
   - User IP address, MAC address, or hostname.
   - User cookies, local storage tokens, or browser fingerprints.
   - Proprietary borehole core ownership data.
3. **Data Protection Guarantee:**
   - In accordance with Google Gemini API terms for API keys, user API requests are processed securely and are not used to train global foundational models without enterprise authorization.
   - If the user prefers 100% offline local operation, omitting `GEMINI_API_KEY` activates the **Deterministic Scientific Offline Rules Engine**, which executes entirely on the local machine with zero network transmission.

---

## 4. User Rights and Data Control

As TERRANEXUS 4D stores no personal accounts or cloud profiles:
- Users have full sovereignty over their local data.
- Deleting the `server/data/raw/` or `server/data/processed/` folders completely removes all downloaded satellite granules and derived time series from the local machine.
- No remote telemetry or tracking beacons exist in the codebase.

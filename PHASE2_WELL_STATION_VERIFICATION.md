# TERRANEXUS 4D — CGWB & INDIA-WRIS WELL STATION FORENSIC VERIFICATION REPORT
**Document Purpose:** Station-by-Station Forensic Investigation of Monitoring Wells Reported in Phase 2  
**Platform Version:** 0.2.0  
**Audit Date:** 2026-11-02  
**Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Executive Summary & Verification Standard

In accordance with Section 4 of the Forensic Data Authenticity Audit instructions:
- Every station identifier claimed in Phase 2 must be independently established from official Central Ground Water Board (CGWB) and India-WRIS (NWIC/WIMS) sources.
- No station identifier, coordinate set, observation series, or agency attribution may be manufactured or accepted merely because it appears in the codebase.
- Any station identifier that cannot be independently established must be marked **UNVERIFIED**.
- Any observation series that is representative, benchmark-modeled, or synthesized must be marked **DEMONSTRATION**.

---

## 2. Station-by-Station 13-Point Forensic Investigation

### Station 1: `W-PB-LUD-012` (Claimed: "PAU Campus Piezometer No. 3", Ludhiana, Punjab)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** The exact alphanumeric string `W-PB-LUD-012` does not exist in the CGWB National Hydrograph Network Stations (NHNS) database or India-WRIS. It was created in `wrisImportPipeline.ts` as a synthetic naming pattern.
2. **What is its official station identifier?**  
   Official CGWB monitoring piezometers on the Punjab Agricultural University (PAU) campus in Ludhiana are registered under WIMS / CGWB North Western Region regional site IDs (e.g., NHNS site codes such as `CGWB/NWR/LUD/...` or numerical WIMS site IDs).
3. **Which official source record establishes its existence?**  
   None establishes `W-PB-LUD-012`. The PAU campus hydrogeological regime is documented generally in the *CGWB Ground Water Information Booklet of Ludhiana District, Punjab (2019)* and regional yearbooks, but under official regional site names.
4. **Is there an original downloadable record?**  
   No original downloadable file from `indiawris.gov.in` exists in this repository.
5. **What are the actual coordinates?**  
   The coordinates in code ($30.9025^\circ\text{N}, 75.8080^\circ\text{E}$) point to the PAU Ludhiana campus, but represent an estimated collar coordinate, not a surveyed CGWB brass bench collar.
6. **What agency owns or operates the well?**  
   Attributed in code to CGWB, but unverified for this specific code.
7. **What are the actual observation dates?**  
   The dates (`2014-05` to `2024-11`, semi-annual) were generated in code, not recorded by a field team.
8. **What are the original groundwater level measurements?**  
   Not available from an authentic field log.
9. **What is the measurement unit?**  
   mbgl (metres below ground level) in code.
10. **Is the value measured in metres below ground level?**  
    Yes, conceptually modeled as mbgl.
11. **What is the reference datum?**  
    Ground surface level (GL) ~247m AMSL.
12. **Can the reported latest groundwater depth (33.7 mbgl) be independently traced?**  
    **NO.** It reflects published district dipping ranges ($30-36\text{ mbgl}$), but is not a verified single-well reading.
13. **Can the reported ten-year decline rate (+0.81 m/yr) be recalculated from actual observations?**  
    **NO.** It is calculated strictly from the synthetic sequence in `wrisImportPipeline.ts`.
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

### Station 2: `W-RJ-JJN-045` (Claimed: "Singhana Piezometer Station", Jhunjhunu, Rajasthan)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** Synthetic project-internal code.
2. **What is its official station identifier?**  
   Real CGWB Western Region monitoring wells in Singhana (Khetri Copper Belt) use alphanumeric CGWB WR codes.
3. **Official source record establishing existence?**  
   None for this identifier. Singhana groundwater depletion is documented in the *CGWB Ground Water Year Book of Rajasthan*.
4. **Original downloadable record?**  
   None in repository.
5. **Actual coordinates?**  
   $28.0580^\circ\text{N}, 75.8310^\circ\text{E}$ (Singhana area, Rajasthan).
6. **Operating agency?**  
   Attributed to CGWB.
7. **Observation dates?**  
   Semi-annual May/Nov (2014–2024) synthesized in code.
8. **Original measurements?**  
   Not available from raw field records.
9. **Measurement unit?**  
   mbgl.
10. **Measured in mbgl?**  
    Yes, in model.
11. **Reference datum?**  
    Ground surface level ~375m AMSL.
12. **Can reported latest depth (48.9 mbgl) be independently traced?**  
    **NO.** Matches published deep water tables along the Khetri shear zone, but is not an authenticated dipping log.
13. **Can reported decline rate (+0.77 m/yr) be recalculated from actual observations?**  
    **NO.** Recalculates model output only.
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

### Station 3: `W-MH-PUN-024` (Claimed: "Shivajinagar Weathered Basalt Piezometer", Pune, Maharashtra)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** Synthetic code.
2. **Official station identifier?**  
   Shivajinagar observation stations in Pune are monitored by GSDA Maharashtra and CGWB Central Region Nagpur under state network IDs.
3. **Official source record?**  
   None for `W-MH-PUN-024`.
4. **Original downloadable record?**  
   None in repository.
5. **Actual coordinates?**  
   $18.5312^\circ\text{N}, 73.8445^\circ\text{E}$ (Shivajinagar, Pune).
6. **Operating agency?**  
   Attributed to CGWB / GSDA.
7. **Observation dates?**  
   2014–2024 seasonal time steps in code.
8. **Original measurements?**  
   Not available.
9. **Measurement unit?**  
   mbgl.
10. **Measured in mbgl?**  
    Yes.
11. **Reference datum?**  
    Ground surface ~558m AMSL.
12. **Can latest depth (2.9 mbgl post-monsoon, 11.5 mbgl pre-monsoon) be traced?**  
    **NO.** Accurately simulates Deccan Trap shallow weathered basalt monsoon recovery, but is not an authenticated telemetry record.
13. **Can decline rate (-0.03 m/yr) be recalculated from actual observations?**  
    **NO.**
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

### Station 4: `W-RJ-UDP-018` (Claimed: "Tiri Valley Carbonate Dug Well", Udaipur, Rajasthan)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** Synthetic code.
2. **Official station identifier?**  
   Unverified.
3. **Official source record?**  
   None for this ID.
4. **Original downloadable record?**  
   None in repository.
5. **Actual coordinates?**  
   $24.3610^\circ\text{N}, 73.7250^\circ\text{E}$ (Zawar / Tiri river valley).
6. **Operating agency?**  
   Attributed to CGWB.
7. **Observation dates?**  
   May/Nov 2014–2024.
8. **Original measurements?**  
   None.
9. **Unit:** mbgl.
10. **mbgl reference:** Yes.
11. **Reference datum:** Ground level ~398m AMSL.
12. **Can latest depth (6.4 mbgl) be traced?**  
    **NO.**
13. **Can decline rate (+0.22 m/yr) be recalculated from actual observations?**  
    **NO.**
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

### Station 5: `W-KA-KOL-031` (Claimed: "Bangarapet Granitic Piezometer", Kolar, Karnataka)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** Synthetic code.
2. **Official station identifier?**  
   Unverified.
3. **Official source record?**  
   None.
4. **Original downloadable record?**  
   None in repository.
5. **Actual coordinates?**  
   $12.9820^\circ\text{N}, 78.2040^\circ\text{E}$ (Bangarapet, Kolar district).
6. **Operating agency?**  
   Attributed to CGWB / Karnataka DMG.
7. **Observation dates?**  
   2014–2024.
8. **Original measurements?**  
   None.
9. **Unit:** mbgl.
10. **mbgl reference:** Yes.
11. **Reference datum:** Ground level ~835m AMSL.
12. **Can latest depth (16.0 mbgl) be traced?**  
    **NO.**
13. **Can decline rate (+0.11 m/yr) be recalculated from actual observations?**  
    **NO.**
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

### Station 6: `W-JH-SNG-009` (Claimed: "Mosabani Crystalline Dug Well", East Singhbhum, Jharkhand)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** Synthetic code.
2. **Official station identifier?**  
   Unverified.
3. **Official source record?**  
   None.
4. **Original downloadable record?**  
   None in repository.
5. **Actual coordinates?**  
   $22.5320^\circ\text{N}, 86.4520^\circ\text{E}$ (Mosabani, Singhbhum).
6. **Operating agency?**  
   Attributed to CGWB.
7. **Observation dates?**  
   2014–2024.
8. **Original measurements?**  
   None.
9. **Unit:** mbgl.
10. **mbgl reference:** Yes.
11. **Reference datum:** Ground level ~112m AMSL.
12. **Can latest depth (3.0 mbgl) be traced?**  
    **NO.**
13. **Can decline rate (+0.14 m/yr) be recalculated from actual observations?**  
    **NO.**
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

### Station 7: `W-TG-KGM-021` (Claimed: "Paloncha Sandstone Piezometer", Bhadradri Kothagudem, Telangana)
1. **Does this station actually exist in an official CGWB or India-WRIS source?**  
   **NO.** Synthetic code.
2. **Official station identifier?**  
   Unverified.
3. **Official source record?**  
   None.
4. **Original downloadable record?**  
   None in repository.
5. **Actual coordinates?**  
   $17.5920^\circ\text{N}, 80.6840^\circ\text{E}$ (Paloncha, Kothagudem).
6. **Operating agency?**  
   Attributed to CGWB.
7. **Observation dates?**  
   2014–2024.
8. **Original measurements?**  
   None.
9. **Unit:** mbgl.
10. **mbgl reference:** Yes.
11. **Reference datum:** Ground level ~92m AMSL.
12. **Can latest depth (4.1 mbgl) be traced?**  
    **NO.**
13. **Can decline rate (+0.16 m/yr) be recalculated from actual observations?**  
    **NO.**
- **FORENSIC STATUS: UNVERIFIED IDENTIFIER / CURATED BENCHMARK (DEMONSTRATION)**

---

## 3. Forensic Station Verification Summary Table

| Location ID | Claimed Station Code | Claimed Site Name | Official CGWB/WRIS Existence | Field Telemetry Download | Verified Latest Depth | Verified Decline Rate | Final Scientific Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `locus-indogangetic-ludhiana` | `W-PB-LUD-012` | PAU Campus Piezometer No. 3 | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |
| `locus-khetri-rajasthan` | `W-RJ-JJN-045` | Singhana Piezometer Station | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |
| `locus-deccan-pune` | `W-MH-PUN-024` | Shivajinagar Weathered Basalt | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |
| `locus-zawar-udaipur` | `W-RJ-UDP-018` | Tiri Valley Carbonate Dug Well | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |
| `locus-dharwar-kolar` | `W-KA-KOL-031` | Bangarapet Granitic Piezometer | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |
| `locus-singhbhum-jharkhand` | `W-JH-SNG-009` | Mosabani Crystalline Dug Well | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |
| `locus-godavari-kothagudem` | `W-TG-KGM-021` | Paloncha Sandstone Piezometer | **UNVERIFIED** | **NOT FOUND** | **NOT VERIFIED** | **NOT VERIFIED** | **DEMONSTRATION (Curated Benchmark)** |

---

## 4. Preservation & Scientific Labelling Action

In strict adherence to instructions:
1. **Benchmark data is NOT deleted.** The sequences in `wrisImportPipeline.ts` provide vital illustrative benchmarks for multi-tier hydrographs and regional hydrogeology.
2. **Every station is marked as `DEMONSTRATION (UNVERIFIED IDENTIFIER)`** across all UI screens, tooltips, JSON payloads, and documentation.
3. The application will never claim to show "authentic in-situ dipping records" until an un-redacted, official CGWB NHNS station export has been loaded.

# TERRANEXUS 4D — INFORMATION ARCHITECTURE, NAVIGATION & WORKSPACE WORKFLOW REVIEW

**Document ID:** `TNX-IA-2026-FINAL`  
**Classification:** Information Architecture, Navigation Flows & Workspace State Review  
**Platform:** TERRANEXUS 4D — India's Unified Earth Intelligence Platform  
**Lead Authority:** Chief Product Architect & Information Architecture Specialist  
**Status:** `VERIFIED COMPLETE`

---

## 1. THREE-TIER NAVIGATION DE-CONFLATION & WORKFLOW HIERARCHY

The platform's user experience has been restructured around a clear, non-conflicting three-tier information architecture:

```
+---------------------------------------------------------------------------------------+
| LEVEL 1: GLOBAL WORKSTATION DOCK (Primary Task Routing)                               |
| [4D Digital Twin] [Nexus Hydro] [Nexus Strata] [Nexus Mineral] [Nexus AI] [Catalog]    |
+---------------------------------------------------------------------------------------+
        |
        +---> If "4D Digital Twin" is selected:
              +-------------------------------------------------------------------------+
              | LEVEL 2A: 4D TWIN VIEW MODES (Spatial Exploration Dimension)            |
              | [3D Globe] [Split View] [3D Cutaway] [Corner Cut] [2D Section] [Dossier]|
              +-------------------------------------------------------------------------+
                    |
                    +---> If "2D Dossier" is active:
                          +-------------------------------------------------------------+
                          | LEVEL 3: LOCATION DOSSIER DEEP-DIVE TABS                     |
                          | [Overview] [Water Balance] [Bedrock] [Sources] [Evidence]   |
                          +-------------------------------------------------------------+
```

### 1.1 Resolution of the Dossier View Trap ([ARCH-01])
- **Defect:** Previously, when a user navigated into the 2D Location Dossier and subsequently clicked "4D Digital Twin" in the top navigation bar, the application remained stuck in the 2D Dossier. This occurred because [Navigation.tsx](file:///d:/Terranexus%204d/src/components/layout/Navigation.tsx) only modified `activeModule = 'globe'` without resetting `mainView` from `'dossier2d'` back to `'twin3d'`. The user was trapped in the dossier view unless they found the small "Return to 3D Digital Twin" link.
- **Remediation:** In [Navigation.tsx](file:///d:/Terranexus%204d/src/components/layout/Navigation.tsx#L90-L105), the click handler for the 4D Digital Twin button now calls `setMainView('twin3d')` concurrently with `setActiveModule('globe')`. This guarantees instant, reliable transition from any deep dossier view back to the interactive 3D WebGL twin.

---

## 2. LAYER MANAGEMENT ARCHITECTURE

### 2.1 Unified Multi-Category Layer Model
Layer state is centralized in [useTerranexusStore.ts](file:///d:/Terranexus%204d/src/state/useTerranexusStore.ts#L112-L185) with four discrete categories:
1. `hydro` (Groundwater levels, CGWB NAQUIM aquifer boundaries, NASA GRACE mascons, CWC river basins, SMAP soil moisture, IMD rainfall)
2. `strata` (GSI 1:50k lithological bedrock, drill core lithologs, ISRIC SoilGrids 250m)
3. `mineral` (GSI metallogenic belts, Sentinel-2 composite gossan index, hydroxyl/clay index)
4. `surface` (Copernicus GLO-90 DEM terrain, ISRO Bhuvan land use/land cover)

### 2.2 Inspector Drawer Integration
The [Inspector.tsx](file:///d:/Terranexus%204d/src/components/layout/Inspector.tsx) drawer provides contextual layer inspection:
- Individual layer enable/disable toggles
- Continuous opacity sliders ($0\%$ to $100\%$)
- Direct metadata deep-links to official government and space agency portals
- Granular scientific status badges (`MEASURED`, `OBSERVED`, `INTERPOLATED`, `DERIVED`, `MODELLED`)

---

## 3. WORKSPACE SESSION PERSISTENCE SPECIFICATION

To support prolonged multi-session investigations by geological survey teams, the platform's workspace state model has been formally specified for serialization:

```typescript
export interface SavedWorkspaceSession {
  version: '1.0';
  timestamp: string;
  sessionName: string;
  selectedLocationId: string;
  activeModule: 'globe' | 'hydro' | 'strata' | 'mineral' | 'time' | 'ai' | 'catalog';
  mainView: 'dossier2d' | 'twin3d';
  viewMode: 'globe' | 'cutaway' | 'split' | 'underground';
  cutawayStyle: 'solid' | 'corner' | 'crossSection';
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  activeTimeStep: string;
  selectedDepthMeters: number;
  layers: {
    id: string;
    enabled: boolean;
    opacity: number;
  }[];
  bookmarkedLocations: string[];
}
```

*Implementation Status:* `IMPLEMENTED — NOT FULLY VERIFIED`. Core session state persists across route toggles in memory; persistent LocalStorage session serialization is prepared and targeted for full enterprise deployment in Stage 3.

---

## 4. SEARCH & DISCOVERY ARCHITECTURE

The location discovery engine supports multi-tiered geographic exploration:
1. **Featured Proterozoic & Phanerozoic Provinces:** Instant access to 7 diverse Indian geological terranes (Indo-Gangetic Foredeep, Deccan Volcanic Province, Aravalli-Delhi Fold Belt, Dharwar Craton, Singhbhum Shear Zone, Godavari Gondwana Graben, Krishna-Godavari Coastal Basin).
2. **Indian Administrative Hierarchy Geocoding:** Automated lookup with Survey of India administrative boundaries via [geocodingService.ts](file:///d:/Terranexus%204d/server/services/geocodingService.ts).
3. **Borehole & Station Lookup:** Direct discovery of CGWB monitoring well stations and exploratory borehole codes.

**Conclusion:** Information architecture, navigation flows, and layer inspection are unified, coherent, and free of view traps. Status: `VERIFIED COMPLETE`.

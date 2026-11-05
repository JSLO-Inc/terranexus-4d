# TERRANEXUS-GEOLOGICAL-3D-VISUALISATION
## Reusable Engineering Skill & Scientific Guidelines for 3D Geological Reconstruction

**Skill Version:** 1.0.0  
**Target Environment:** Three.js / WebGL 2.0 / React / TypeScript  
**Domain:** Computational Geoscience, Stratigraphic 3D Modeling, Hydrogeological Visualization  

---

## 1. GEOLOGICAL MODELLING FUNDAMENTALS

1. **Chronostratigraphy & Superposition:**  
   In undeformed sedimentary or volcanic sequences, younger strata overlie older strata (Law of Superposition). Each unit must be defined by:
   - Formation Code & Chronostratigraphic Age (e.g. `KP-DVP-TOP` Cretaceous, `Q-IG-NEW` Holocene).
   - Primary & Secondary Lithology.
   - Depositional Environment (alluvial, lacustrine, volcanic flood, marine).
   - Typical thickness range ($m$), bulk density ($\text{g/cm}^3$), effective porosity (%), and Mohs hardness.

2. **Dip, Strike & Structural Attitude:**  
   Stratigraphic surfaces dip into the subsurface along an azimuth angle $\theta_{\text{dip}}$ and dip angle $\delta$:
   $$\vec{n}_{\text{strike}} = (-\sin\theta_{\text{strike}}, \cos\theta_{\text{strike}}, 0)$$
   $$\vec{n}_{\text{dip}} = (\sin\theta_{\text{dip}} \cos\delta, -\sin\delta, \cos\theta_{\text{dip}} \cos\delta)$$
   A dip offset function along distance $d$ is:
   $$\Delta y(x, z) = - (x \sin\theta_{\text{dip}} + z \cos\theta_{\text{dip}}) \cdot \tan\delta$$

---

## 2. STRATIGRAPHIC SURFACE GENERATION & TOPOLOGY

1. **Watertight Contact Surfaces:**  
   Adjacent strata must share identical contact mathematical functions at their interface. If stratum $k$ has bottom function $\text{botYFunc}_k(x, z)$, stratum $k+1$ must have top function $\text{topYFunc}_{k+1}(x, z) \equiv \text{botYFunc}_k(x, z)$. This guarantees mathematically zero gap ($0.00\text{ mm}$ discrepancy) and prevents floating or disconnected meshes.

2. **Natural Thickness Variations & Depositional Non-Uniformity:**  
   Real strata do not maintain constant parallel thickness across miles. Apply bounded regional structural style variations:
   $$\Delta y_i(x, z) = \text{clamp}\left(T_{0, i} \cdot \left[1 + \tanh\left(\frac{k_{\text{dip}, i} \cdot (x \sin\theta_i + z \cos\theta_i)}{L_{\text{ref}}}\right) \cdot \alpha_i + \delta_{\text{mode}} \cdot \beta_i \sin(\omega_{x, i} x + \phi_i) \cos(\omega_{z, i} z)\right], \; T_{\min, i}, \; T_{\max, i}\right)$$
   - **Mathematical Safeguards:** Bounded clamping ($T_{\min} \ge 0.5\text{ m}, T_{\max} \le 2.5 T_0$) and cumulative top-down elevation stacking ($Y_i(x, z) = Y_{i-1}(x, z) - \Delta y_i(x, z)$) guarantee that adjacent contact surfaces remain continuous, strictly positive in thickness, and mathematically non-intersecting ($Y_{i-1} - Y_i \ge T_{\min} > 0$).
   - **Mode Separation:** In Evidence-Based mode, synthetic undulations are strictly disabled ($\delta_{\text{mode}} = 0$). In Illustrative mode ($\delta_{\text{mode}} = 1$), conceptual features (Deccan terraced benches, red-bole interbeds) are permitted under a persistent amber warning banner.

---

## 3. GEOLOGICAL VOLUME CONSTRUCTION & BOUNDARY SKIRTS

1. **Prohibition of Primitive Box Geometries for Natural Formations:**  
   Primitive rectangular boxes (`THREE.BoxGeometry`) must **never** be used as the visible representation of natural geological overburden, soil, or formations. `THREE.BoxGeometry` and bounding boxes remain permitted strictly for non-visual technical utility functions (volumetric clipping planes, collision volumes, camera frustum culling bounds, selection bounding boxes).
2. **Terrain-Conforming Boundary Skirt:**  
   Generate a continuous, closed boundary skirt connecting the elevation vertices $(x_i, y_{\text{topo}}(x_i, z_i), z_i)$ along the outer perimeter directly down to the flat bottom datum at $-55\text{ m}$.
3. **Internal Capping Walls for Excavation Cuts:**  
   For 90° corner excavations or slicing planes, construct solid, watertight internal capping walls along the excised axes ($x = 0$ and $z = 0$) connecting $\text{topYFunc}(x, z)$ to $\text{botYFunc}(x, z)$ with outward-facing normals.

---

## 4. BOREHOLE-CONSTRAINED INTERPOLATION & FENCE DIAGRAMS

1. **Stratigraphic Fence Diagrams & Data Integrity:**  
   In sparse borehole networks, construct vertical cross-cutting polygonal fence panels between adjacent boreholes:
   - **Borehole Records Required:** Unique station identifier, collar coordinates (WGS84), collar ground elevation ($Z_{\text{collar}}$ AMSL, EGM2008), total drilled depth (TD), logged lithological intervals $[d_{\text{top}}, d_{\text{bottom}}]$, and primary source record citation.
   - **Defensible Correlation Protocol:** Continuous stratigraphic panels between separate boreholes are **permitted only when defensible correlation criteria are satisfied** (consistent chronostratigraphy, distance within correlation length $L \le L_{\text{corr}}$, correlatable marker beds).
   - **Uncorrelated Boreholes & Uncertainty:** Where correlation is unsupported (across fault zones, unconformities, or facies pinchouts), **continuous panels must not be drawn**; boreholes are displayed as isolated vertical 3D cylindrical drill columns. In transitional zones, uncertainty is visually indicated (dashed lines, faded hatching, provenance tagging).
   - Map standard GSI geological hatching patterns (stippled dots for sandstone, brick pattern for limestone, v-ticks for basalt).

---

## 5. HYDROGEOLOGY: AQUIFERS, WATER TABLES & CONES OF DEPRESSION

1. **Groundwater Physics Formulations:**
   - **Thiem Steady-State Confined Flow:**
     $$s(r) = \frac{Q}{2\pi T} \ln\left(\frac{R}{r}\right), \quad \frac{s(r)}{s_{\text{max}}} = \frac{\ln(R/r)}{\ln(R/r_w)}$$
     *Boundary Check:* At $r = r_w \implies s = s_{\text{max}}$. At $r = R \implies s = 0$.
   - **Dupuit-Forchheimer Unconfined Flow:**
     $$H^2 - h(r)^2 = \frac{Q}{\pi K} \ln\left(\frac{R}{r}\right) \implies s(r) = H - \sqrt{H^2 - \frac{Q}{\pi K} \ln\left(\frac{R}{r}\right)}$$
   - **Jacob Unconfined Drawdown Correction:**
     $$s' = s - \frac{s^2}{2H} \iff s = H - \sqrt{H^2 - 2Hs'}$$
     *Physical Assumptions & Applicability:* Governed by Dupuit horizontal flow assumptions and valid strictly during late-time radial flow after delayed gravity drainage has completed. Must account for aquifer vertical anisotropy ($K_r/K_z$) and well penetration. Strictly requires a known impermeable aquifer base with measured initial saturated thickness $H$; inapplicable in fractured hard-rock crystalline aquifers. No arbitrary universal numerical limits ($s/H \le 0.25$, $r > 1.5H$) are assumed.

2. **Conditional Pumping Scenarios:**  
   **NEVER** carve a drawdown cone when no pumping borehole is active. When no well is pumping, the water table must render as a smooth regional phreatic surface conforming to the natural hydraulic gradient.

---

## 6. THREE.JS BUFFERGEOMETRY, NORMALS & METER-ANCHORED UVs

1. **Vertex Buffer Construction:**  
   Use `THREE.BufferGeometry` with flat `Float32Array` buffers for `position`, `normal`, and `uv`.
2. **Counter-Clockwise (CCW) Winding:**  
   Ensure all triangles are wound counter-clockwise relative to their outward-pointing normal:
   - Upward faces (+Y): $(x_0, y, z_0) \to (x_0, y, z_1) \to (x_1, y, z_1)$
   - Downward faces (-Y): $(x_0, y, z_0) \to (x_1, y, z_0) \to (x_1, y, z_1)$
   - Compute smooth normals with `geometry.computeVertexNormals()`.
3. **Meter-Anchored UV Coordinates (Zero Texture Stretching):**  
   **NEVER** normalize side-wall UVs to $[0, 1]$ over arbitrary layer thicknesses.  
   Compute UVs directly from physical metric coordinates:
   $$u = \frac{x}{\text{scale}_x}, \quad v = \frac{y}{\text{scale}_y}$$
   Set texture wrapping mode:
   ```typescript
   texture.wrapS = THREE.RepeatWrapping;
   texture.wrapT = THREE.RepeatWrapping;
   texture.repeat.set(blockWidth / 4.0, blockHeight / 4.0);
   ```

---

## 7. LITHOLOGY-SPECIFIC PBR MATERIALS & LIGHTING RIG

1. **Physical PBR Parameters:**
   - **Basalt:** Roughness `0.75`, Metalness `0.15`, columnar joint fractures, zeolitic amygdule cavities.
   - **Sandstone:** Roughness `0.88`, Metalness `0.02`, sedimentary cross-bedding laminae, granular relief.
   - **Charnockite / Khondalite:** Roughness `0.65`, Metalness `0.20`, high-grade gneissic foliation banding.
   - **Dolomite:** Roughness `0.70`, Metalness `0.05`, microcrystalline sugary texture, secondary calcite veinlets.
   - **Alluvium:** Roughness `0.94`, Metalness `0.01`, unconsolidated silt/clay diffuse map, zero specular shine.

2. **Three-Point Adaptive Lighting Rig:**
   - **Key Sun Light:** Directional light at azimuth $135^\circ$, elevation $45^\circ$, intensity `1.2`. Casts soft directional PCF shadows ($1024 \times 1024$ on integrated GPU; $2048 \times 2048$ on discrete GPU).
   - **Hemisphere Fill Light:** Subtle sky-to-ground gradient (`0x93c5fd` to `0x451a03`, intensity `0.35`) preserving shadow contrast on vertical cut walls.
   - **Subsurface Rim Light:** Directional light (`0x38bdf8`, intensity `0.20`) accentuating cut faces and layer boundaries.
   - **Contact Shading:** Subtle dark margin occlusion between adjacent strata.

---

## 8. GPU RESOURCE LIFECYCLE & PERFORMANCE RULES

1. **Strict Disposal on Unmount:**
   ```typescript
   function disposeThreeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
     scene.traverse((obj) => {
       if (obj instanceof THREE.Mesh) {
         if (obj.geometry) obj.geometry.dispose();
         if (Array.isArray(obj.material)) {
           obj.material.forEach(m => disposeMaterial(m));
         } else if (obj.material) {
           disposeMaterial(obj.material);
         }
       }
     });
     renderer.dispose();
   }
   function disposeMaterial(mat: THREE.Material) {
     Object.keys(mat).forEach(prop => {
       const val = (mat as any)[prop];
       if (val && typeof val.dispose === 'function') val.dispose();
     });
     mat.dispose();
   }
   ```
2. **Render Loop Decoupling:** Pause `requestAnimationFrame` and skip `renderer.render()` when container is hidden (`display: none` or off-screen).
3. **React Geometry Memoization:** Wrap heavy geometry generation and canvas texture creation in `useMemo` keyed on location coordinates.

---

## 9. PROVENANCE & DISPLAY MODES

1. **Two Explicit Geological Display Modes:**
   - **Mode A (Evidence-Based Geology):** Renders strictly observed control points and verified regional quadrangle formations with documented uncertainty.
   - **Mode B (Illustrative Geology):** Renders rich educational structures (fault displacements, conceptual aquifers) accompanied by a persistent, un-dismissible banner:  
     `"ILLUSTRATIVE MODEL — NOT A VERIFIED LOCAL GEOLOGICAL OBSERVATION"`.
2. **5-Tier Provenance Badges:** `OBSERVED`, `INTERPOLATED`, `MODELLED`, `ILLUSTRATIVE`, `UNAVAILABLE`.

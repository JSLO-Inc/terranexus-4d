import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../../data/strataData';
import { StatusBadge } from '../common/StatusBadge';
import { Box, Sliders, Droplet, Layers } from 'lucide-react';

export const Subsurface3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { selectedLocation, depthMeters, selectedBorehole } = useTerranexusStore();
  const [hoveredStratum, setHoveredStratum] = useState<any>(null);

  const formations = GEOLOGICAL_FORMATIONS[selectedLocation.id] || [];
  const borehole = AUTHENTIC_BOREHOLES.find(b => b.locationId === selectedLocation.id);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(40, 30, 45);
    camera.lookAt(0, -5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Group for all strata layers
    const strataGroup = new THREE.Group();
    scene.add(strataGroup);

    // Base dimensions for geological block cutaway
    const blockWidth = 24;
    const blockLength = 24;
    const verticalScale = 0.05; // 1 unit = 20 meters

    let currentY = 0;

    // Render Strata Slabs based on real formations
    const interactiveMeshes: THREE.Mesh[] = [];

    formations.forEach((formation, index) => {
      const slabThickness = Math.max(formation.typicalThicknessMeters * verticalScale, 3);
      const geometry = new THREE.BoxGeometry(blockWidth, slabThickness, blockLength);
      
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(formation.colorHex),
        roughness: 0.8,
        metalness: 0.1,
        transparent: true,
        opacity: 0.95
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = currentY - slabThickness / 2;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      mesh.userData = {
        name: formation.name,
        lithology: formation.primaryLithology,
        age: formation.age,
        porosity: formation.porosityAvg,
        density: formation.densityGcm3
      };

      strataGroup.add(mesh);
      interactiveMeshes.push(mesh);

      // Add wireframe boundary edge
      const wireGeo = new THREE.EdgesGeometry(geometry);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 1 });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      wireframe.position.copy(mesh.position);
      strataGroup.add(wireframe);

      currentY -= slabThickness;
    });

    // Render Borehole Drill String (Vertical 3D core cylinder)
    if (borehole) {
      const boreholeDepth = borehole.totalDepthMeters * verticalScale;
      const pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, boreholeDepth, 16);
      const pipeMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        roughness: 0.2
      });
      const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      pipeMesh.position.set(4, -boreholeDepth / 2, 4);
      strataGroup.add(pipeMesh);

      // Drill Collar top icon
      const collarGeo = new THREE.ConeGeometry(1.2, 2, 8);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.set(4, 1, 4);
      collarMesh.rotation.x = Math.PI;
      strataGroup.add(collarMesh);

      // Water Table plane in borehole
      const waterTableY = -borehole.waterTableDepthMeters * verticalScale;
      const wtGeo = new THREE.PlaneGeometry(blockWidth * 1.1, blockLength * 1.1);
      const wtMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const wtMesh = new THREE.Mesh(wtGeo, wtMat);
      wtMesh.rotation.x = Math.PI / 2;
      wtMesh.position.y = waterTableY;
      strataGroup.add(wtMesh);
    }

    // Interactive Depth Slice Plane
    const sliceGeo = new THREE.PlaneGeometry(blockWidth * 1.15, blockLength * 1.15);
    const sliceMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const depthSliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
    depthSliceMesh.rotation.x = Math.PI / 2;
    depthSliceMesh.position.y = -depthMeters * verticalScale;
    strataGroup.add(depthSliceMesh);

    // Simple mouse drag rotation
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        strataGroup.rotation.y += deltaX * 0.008;
        strataGroup.rotation.x += deltaY * 0.005;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }

      // Raycaster for hover info
      if (!isDragging && mountRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes);

        if (intersects.length > 0) {
          setHoveredStratum(intersects[0].object.userData);
        } else {
          setHoveredStratum(null);
        }
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const dom = mountRef.current;
    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      // Gentle idle turntable rotation
      if (!isDragging) {
        strataGroup.rotation.y += 0.0015;
      }
      depthSliceMesh.position.y = -depthMeters * verticalScale;
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (dom.contains(renderer.domElement)) {
        dom.removeChild(renderer.domElement);
      }
    };
  }, [selectedLocation, depthMeters]);

  return (
    <div className="relative w-full h-full bg-[#080c14] select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Status */}
      <div className="absolute top-4 left-4 bg-slate-950/85 border border-slate-800 rounded-xl p-3 backdrop-blur z-10 shadow-xl max-w-sm">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <Box className="w-4 h-4" />
            <span>3D STRATIGRAPHIC CUTAWAY</span>
          </div>
          <StatusBadge status="OBSERVED" size="sm" />
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Volumetric block diagram derived from published GSI 1:50,000 geological mapping & deep exploratory drill-holes.
        </p>
        <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
          <span className="flex items-center gap-1 text-cyan-400">
            <Droplet className="w-3 h-3" /> Water Table Horizon
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <Sliders className="w-3 h-3" /> Depth Slice Plane (-{depthMeters}m)
          </span>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredStratum && (
        <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-amber-600/50 rounded-xl p-3 backdrop-blur z-10 shadow-2xl max-w-xs text-xs animate-fadeIn">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{hoveredStratum.name}</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mb-2">
            {hoveredStratum.lithology}
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
            <div>Age: <span className="text-slate-200">{hoveredStratum.age}</span></div>
            <div>Density: <span className="text-slate-200">{hoveredStratum.density} g/cm³</span></div>
            <div>Porosity: <span className="text-slate-200">{hoveredStratum.porosity}%</span></div>
          </div>
        </div>
      )}

      {/* Drag instruction notice */}
      <div className="absolute bottom-4 left-4 bg-slate-950/70 border border-slate-800/60 rounded px-2.5 py-1 text-[10px] font-mono text-slate-400 backdrop-blur pointer-events-none">
        Click & Drag to rotate 3D block • Depth slice: -{depthMeters}m
      </div>
    </div>
  );
};

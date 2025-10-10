import React from 'react'
import { ThreeScene } from './components/ThreeScene'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { SceneProvider } from './contexts/SceneContext'
import './App.css'

function App() {
    return (
        <SceneProvider>
            <div className="app-container">
                <LeftPanel />
                <ThreeScene />
                <RightPanel />
            </div>
        </SceneProvider>
    )
}

export default App






// import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
// import * as THREE from 'three'
// import { TrackballControls } from 'three/addons/controls/TrackballControls.js'
// import {
//     BufferGeometry, createIsoContourLines, createIsoContoursFilled,
//     Float32BufferAttribute, Uint32BufferAttribute
// } from './keplerlit';

// type SurfaceType = 'wave' | 'sphere' | 'torus';
// type DisplayMode = 'filled' | 'lines' | 'both';

// export default function App() {
//     const mountRef = useRef<HTMLDivElement>(null);
//     const sceneRef = useRef<THREE.Scene | null>(null);
//     const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
//     const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
//     const controlsRef = useRef<TrackballControls | null>(null);
//     const animationIdRef = useRef<number | null>(null);

//     // Mesh references
//     const surfaceMeshRef = useRef<THREE.Mesh | null>(null);
//     const contourMeshRef = useRef<THREE.Mesh | null>(null);
//     const contourLinesRef = useRef<THREE.LineSegments | null>(null);
//     const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);

//     // Geometry data
//     const geometryDataRef = useRef<{ geometry: THREE.BufferGeometry; scalarField: number[] } | null>(null);

//     const [leftPanelOpen, setLeftPanelOpen] = useState(true);
//     const [surfaceType, setSurfaceType] = useState<SurfaceType>('wave');
//     const [displayMode, setDisplayMode] = useState<DisplayMode>('filled');
//     const [numContours, setNumContours] = useState(10);
//     const [showWireframe, setShowWireframe] = useState(false);
//     const [showWireframeIso, setShowWireframeIso] = useState(false);

//     // Initialize Three.js scene
//     useEffect(() => {
//         if (!mountRef.current) return;

//         const scene = new THREE.Scene();
//         scene.background = new THREE.Color(0xaaaaaa);
//         sceneRef.current = scene;

//         const camera = new THREE.PerspectiveCamera(
//             75,
//             mountRef.current.clientWidth / mountRef.current.clientHeight,
//             0.1,
//             1000
//         );
//         camera.position.set(3, 3, 3);
//         camera.lookAt(0, 0, 0);
//         cameraRef.current = camera;

//         const renderer = new THREE.WebGLRenderer({ antialias: true });
//         renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
//         mountRef.current.appendChild(renderer.domElement);
//         rendererRef.current = renderer;

//         const ambientLight = new THREE.AmbientLight(0xffffff, 0.99);
//         scene.add(ambientLight);

//         const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//         directionalLight.position.set(10, 10, 10);
//         scene.add(directionalLight);

//         // Setup the Controls
//         const controls = new TrackballControls(camera, renderer.domElement);
//         // controls.enableDamping = true;
//         // controls.dampingFactor = 0.05;
//         controlsRef.current = controls;

//         const animate = () => {
//             animationIdRef.current = requestAnimationFrame(animate);
//             controls.update()
//             renderer.render(scene, camera);
//         };
//         animate();

//         const handleResize = () => {
//             if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

//             const width = mountRef.current.clientWidth;
//             const height = mountRef.current.clientHeight;

//             cameraRef.current.aspect = width / height;
//             cameraRef.current.updateProjectionMatrix();
//             rendererRef.current.setSize(width, height);
//         };
//         window.addEventListener('resize', handleResize);

//         return () => {
//             window.removeEventListener('resize', handleResize);
//             if (animationIdRef.current) {
//                 cancelAnimationFrame(animationIdRef.current);
//             }
//             if (mountRef.current && renderer.domElement) {
//                 mountRef.current.removeChild(renderer.domElement);
//             }
//             renderer.dispose();
//         };
//     }, []);

//     // Generate surface when parameters change
//     useEffect(() => {
//         generateSurface();
//     }, [surfaceType]);

//     // Generate contours when parameters change
//     useEffect(() => {
//         generateContours();
//     }, [displayMode, numContours, showWireframeIso]);

//     // Update wireframe
//     useEffect(() => {
//         updateWireframe();
//     }, [showWireframe]);

//     // Handle panel resize
//     useLayoutEffect(() => {
//         const timer = setTimeout(() => {
//             if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;

//             const width = mountRef.current.clientWidth;
//             const height = mountRef.current.clientHeight;

//             cameraRef.current.aspect = width / height;
//             cameraRef.current.updateProjectionMatrix();
//             rendererRef.current.setSize(width, height);
//         }, 400);

//         return () => clearTimeout(timer);
//     }, [leftPanelOpen]);

//     const createWaveSurface = (): [THREE.BufferGeometry, number[]] => {
//         const width = 4 * 34;
//         const height = 4 * 34;
//         const geometry = new THREE.PlaneGeometry(4, 4, width - 1, height - 1);

//         const positions = geometry.attributes.position.array;
//         const scalarField: number[] = [];

//         for (let i = 0; i < positions.length; i += 3) {
//             const x = positions[i] / 4;
//             const y = positions[i + 1] / 4;

//             const z = 0.5 * Math.sin(2 * Math.PI * x) * Math.cos(2 * Math.PI * y) +
//                 0.3 * Math.sin(4 * Math.PI * x) * Math.sin(3 * Math.PI * y);
//             positions[i + 2] = z;

//             const scalar = Math.sqrt(x * x + y * y) + z;
//             scalarField.push(scalar);
//         }

//         geometry.attributes.position.needsUpdate = true;
//         geometry.computeVertexNormals();

//         return [geometry, scalarField];
//     };

//     const createSphereSurface = (): [THREE.BufferGeometry, number[]] => {
//         const radius = 1.5;
//         const widthSegments = 4 * 64;
//         const heightSegments = 4 * 32;
//         const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

//         const positions = geometry.attributes.position.array;
//         const scalarField: number[] = [];

//         for (let i = 0; i < positions.length; i += 3) {
//             const x = positions[i];
//             const y = positions[i + 1];
//             const z = positions[i + 2];

//             const scalar = y + 0.5 * Math.sin(5 * Math.atan2(z, x)) * Math.cos(3 * Math.asin(y / radius));
//             scalarField.push(scalar);
//         }

//         return [geometry, scalarField];
//     };

//     const createTorusSurface = (): [THREE.BufferGeometry, number[]] => {
//         const torusRadius = 1.5;
//         const tubeRadius = 0.5;
//         const radialSegments = 4 * 32;
//         const tubularSegments = 4 * 64;
//         const geometry = new THREE.TorusGeometry(torusRadius, tubeRadius, radialSegments, tubularSegments);

//         const positions = geometry.attributes.position.array;
//         const scalarField: number[] = [];

//         for (let i = 0; i < positions.length; i += 3) {
//             const x = positions[i];
//             const y = positions[i + 1];
//             const z = positions[i + 2];

//             const radialDist = Math.sqrt(x * x + z * z);
//             const scalar = y + 0.3 * Math.sin(8 * Math.atan2(z, x)) + 0.2 * Math.sin(6 * Math.atan2(y, radialDist - torusRadius));
//             scalarField.push(scalar);
//         }

//         return [geometry, scalarField];
//     };

//     const clearMeshes = () => {
//         const meshes = [
//             surfaceMeshRef.current,
//             contourMeshRef.current,
//             contourLinesRef.current,
//             wireframeMeshRef.current
//         ];

//         meshes.forEach(mesh => {
//             if (mesh && sceneRef.current) {
//                 sceneRef.current.remove(mesh);
//                 if (mesh.geometry) mesh.geometry.dispose();
//                 if ((mesh as any).material) (mesh as any).material.dispose();
//             }
//         });

//         surfaceMeshRef.current = null;
//         contourMeshRef.current = null;
//         contourLinesRef.current = null;
//         wireframeMeshRef.current = null;
//     };

//     const generateSurface = () => {
//         if (!sceneRef.current) return;

//         clearMeshes();

//         let geometry: THREE.BufferGeometry;
//         let scalarField: number[];

//         switch (surfaceType) {
//             case 'wave':
//                 [geometry, scalarField] = createWaveSurface();
//                 break;
//             case 'sphere':
//                 [geometry, scalarField] = createSphereSurface();
//                 break;
//             case 'torus':
//                 [geometry, scalarField] = createTorusSurface();
//                 break;
//         }

//         geometryDataRef.current = { geometry, scalarField };

//         const material = new THREE.MeshPhongMaterial({
//             color: 0x888888,
//             transparent: false,
//             opacity: 0.3
//         });
//         const mesh = new THREE.Mesh(geometry, material);
//         surfaceMeshRef.current = mesh;
//         sceneRef.current.add(mesh);

//         generateContours();
//         updateWireframe();
//     };

//     const generateContours = () => {
//         if (!sceneRef.current || !geometryDataRef.current) return;

//         // Clear existing contour meshes
//         if (contourMeshRef.current) {
//             sceneRef.current.remove(contourMeshRef.current);
//             contourMeshRef.current = null;
//         }
//         if (contourLinesRef.current) {
//             sceneRef.current.remove(contourLinesRef.current);
//             contourLinesRef.current = null;
//         }

//         const { geometry, scalarField } = geometryDataRef.current;

//         // Convert to keplerlit format
//         const positions = geometry.attributes.position.array;
//         const indices = geometry.index ? geometry.index.array : generateIndices(positions.length / 3);

//         const keplerPositions = new Float32BufferAttribute(Array.from(positions), 3);
//         const keplerIndices = new Uint32BufferAttribute(Array.from(indices), 1);

//         const keplerGeometry = new BufferGeometry();
//         keplerGeometry.setPositions(keplerPositions);
//         keplerGeometry.setIndices(keplerIndices);

//         // Calculate contour levels
//         const minVal = Math.min(...scalarField);
//         const maxVal = Math.max(...scalarField);
//         const isoList: number[] = [];
//         for (let i = 0; i < numContours; i++) {
//             isoList.push(minVal + (i / (numContours - 1)) * (maxVal - minVal));
//         }

//         try {
//             // Generate filled contours
//             if (displayMode === 'filled' || displayMode === 'both') {
//                 const result = createIsoContoursFilled(keplerGeometry, scalarField, isoList, {
//                     //colorTable: 'Rainbow',
//                     nbColors: 512
//                 });

//                 if (result) {
//                     const meshGeometry = new THREE.BufferGeometry();
//                     meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(result.position, 3));
//                     meshGeometry.setIndex(new THREE.Uint32BufferAttribute(result.index, 1));

//                     const colors = new Float32Array(result.color);
//                     meshGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
//                     meshGeometry.computeVertexNormals();

//                     const material = new THREE.MeshPhongMaterial({
//                         vertexColors: true,
//                         side: THREE.DoubleSide,
//                         wireframe: showWireframeIso,
//                         flatShading: false,
//                         polygonOffset: true,
//                         polygonOffsetFactor: 0.5
//                     });

//                     const mesh = new THREE.Mesh(meshGeometry, material);
//                     contourMeshRef.current = mesh;
//                     sceneRef.current.add(mesh);

//                     if (surfaceMeshRef.current) {
//                         sceneRef.current.remove(surfaceMeshRef.current);
//                     }
//                 }
//             }

//             // Generate line contours
//             if (displayMode === 'lines' || displayMode === 'both') {
//                 const result = createIsoContourLines(keplerGeometry, scalarField, isoList, "#000000", "Rainbow");

//                 if (result.positions.length > 0) {
//                     const lineGeometry = new THREE.BufferGeometry();
//                     lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(result.positions, 3));

//                     const lineMaterial = new THREE.LineBasicMaterial({
//                         color: 0x000000,
//                         linewidth: 2
//                     });

//                     const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
//                     contourLinesRef.current = lines;
//                     sceneRef.current.add(lines);
//                 }
//             }
//         } catch (error) {
//             console.error('Error generating contours:', error);
//         }
//     };

//     const generateIndices = (vertexCount: number): Uint32Array => {
//         const indices: number[] = [];
//         for (let i = 0; i < vertexCount - 2; i += 3) {
//             indices.push(i, i + 1, i + 2);
//         }
//         return new Uint32Array(indices);
//     };

//     const updateWireframe = () => {
//         if (!sceneRef.current) return;

//         if (wireframeMeshRef.current) {
//             sceneRef.current.remove(wireframeMeshRef.current);
//             wireframeMeshRef.current = null;
//         }

//         if (showWireframe && surfaceMeshRef.current) {
//             const wireframeGeometry = new THREE.WireframeGeometry(surfaceMeshRef.current.geometry);
//             const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x444444 });
//             const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
//             wireframeMeshRef.current = wireframe;
//             sceneRef.current.add(wireframe);
//         }
//     };

//     return (
//         <div className="flex flex-col h-screen bg-gray-900">
//             {/* Top Menu */}
//             <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
//                 <h1 className="text-xl font-bold">Arch webapp</h1>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={() => setLeftPanelOpen(!leftPanelOpen)}
//                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
//                     >
//                         {leftPanelOpen ? '◀ Controls' : '▶ Controls'}
//                     </button>
//                 </div>
//             </div>

//             {/* Main content area */}
//             <div className="flex flex-1 overflow-hidden">
//                 {/* Left Panel - Controls */}
//                 <div
//                     className={`bg-gray-800 text-white transition-all duration-300 flex-shrink-0 ${leftPanelOpen ? 'w-64' : 'w-0'
//                         } overflow-hidden`}
//                 >
//                     <div className="p-6 w-64">
//                         <h2 className="text-lg font-semibold mb-4">Controls</h2>

//                         {/* Surface Type */}
//                         <div className="mb-4">
//                             <label className="block text-sm font-medium mb-2">Surface Type</label>
//                             <div className="space-y-2">
//                                 {(['wave', 'sphere', 'torus'] as SurfaceType[]).map(type => (
//                                     <button
//                                         key={type}
//                                         onClick={() => setSurfaceType(type)}
//                                         className={`w-full px-3 py-2 rounded text-sm ${surfaceType === type
//                                             ? 'bg-blue-600'
//                                             : 'bg-gray-700 hover:bg-gray-600'
//                                             }`}
//                                     >
//                                         {type.charAt(0).toUpperCase() + type.slice(1)}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* Display Mode */}
//                         <div className="mb-4">
//                             <label className="block text-sm font-medium mb-2">Display Mode</label>
//                             <div className="space-y-2">
//                                 {(['filled', 'lines', 'both'] as DisplayMode[]).map(mode => (
//                                     <button
//                                         key={mode}
//                                         onClick={() => setDisplayMode(mode)}
//                                         className={`w-full px-3 py-2 rounded text-sm ${displayMode === mode
//                                             ? 'bg-blue-600'
//                                             : 'bg-gray-700 hover:bg-gray-600'
//                                             }`}
//                                     >
//                                         {mode.charAt(0).toUpperCase() + mode.slice(1)}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>

//                         {/* Number of Contours */}
//                         <div className="mb-4">
//                             <label className="block text-sm font-medium mb-2">
//                                 Contours: {numContours}
//                             </label>
//                             <input
//                                 type="range"
//                                 min="5"
//                                 max="50"
//                                 value={numContours}
//                                 onChange={(e) => setNumContours(parseInt(e.target.value))}
//                                 className="w-full"
//                             />
//                         </div>

//                         {/* Wireframe toggles */}
//                         <div className="mb-4 space-y-2">
//                             <label className="flex items-center text-sm">
//                                 <input
//                                     type="checkbox"
//                                     checked={showWireframe}
//                                     onChange={(e) => setShowWireframe(e.target.checked)}
//                                     className="mr-2"
//                                 />
//                                 Show Mesh
//                             </label>
//                             <label className="flex items-center text-sm">
//                                 <input
//                                     type="checkbox"
//                                     checked={showWireframeIso}
//                                     onChange={(e) => setShowWireframeIso(e.target.checked)}
//                                     className="mr-2"
//                                 />
//                                 As Wireframe
//                             </label>
//                         </div>

//                         {/* Regenerate button */}
//                         <button
//                             onClick={() => generateSurface()}
//                             className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
//                         >
//                             Regenerate
//                         </button>
//                     </div>
//                 </div>

//                 {/* 3D View (Center) */}
//                 <div className="flex-1 relative">
//                     <div ref={mountRef} className="w-full h-full" />
//                 </div>

//                 {/* Right Panel - Info */}
//                 <div className="bg-gray-800 text-white w-64 flex-shrink-0">
//                     <div className="p-6">
//                         <h2 className="text-lg font-semibold mb-4">Info</h2>
//                         <div className="space-y-3">
//                             <div className="bg-gray-700 p-3 rounded">
//                                 <p className="text-sm font-medium">Current Surface</p>
//                                 <p className="text-xs text-gray-400 mt-1">{surfaceType}</p>
//                             </div>
//                             <div className="bg-gray-700 p-3 rounded">
//                                 <p className="text-sm font-medium">Display Mode</p>
//                                 <p className="text-xs text-gray-400 mt-1">{displayMode}</p>
//                             </div>
//                             <div className="bg-gray-700 p-3 rounded">
//                                 <p className="text-sm font-medium">Contours</p>
//                                 <p className="text-xs text-gray-400 mt-1">{numContours} levels</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

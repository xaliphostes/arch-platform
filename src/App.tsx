import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Create a rotating cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            metalness: 0.5,
            roughness: 0.5
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Create a torus
        const torusGeometry = new THREE.TorusGeometry(1.5, 0.4, 16, 100);
        const torusMaterial = new THREE.MeshStandardMaterial({
            color: 0xff006e,
            metalness: 0.7,
            roughness: 0.3
        });
        const torus = new THREE.Mesh(torusGeometry, torusMaterial);
        torus.position.y = -1;
        scene.add(torus);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            torus.rotation.x += 0.005;
            torus.rotation.y += 0.01;

            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            if (!mountRef.current) return;

            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
            geometry.dispose();
            material.dispose();
            torusGeometry.dispose();
            torusMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            {/* Top Menu */}
            <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
                <h1 className="text-xl font-bold">Three.js React App</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                        {leftPanelOpen ? '◀ Left' : '▶ Left'}
                    </button>
                    <button
                        onClick={() => setRightPanelOpen(!rightPanelOpen)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                        {rightPanelOpen ? 'Right ▶' : '◀ Right'}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel */}
                <div
                    className={`bg-gray-800 text-white transition-all duration-300 ${leftPanelOpen ? 'w-64' : 'w-0'
                        } overflow-hidden`}
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Left Panel</h2>
                        <div className="space-y-3">
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-sm font-medium">Scene Info</p>
                                <p className="text-xs text-gray-400 mt-1">3D Objects: 2</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-sm font-medium">Camera</p>
                                <p className="text-xs text-gray-400 mt-1">Position: (0, 0, 5)</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-sm font-medium">Renderer</p>
                                <p className="text-xs text-gray-400 mt-1">WebGL Active</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3D View (Center) */}
                <div className="flex-1 relative">
                    <div ref={mountRef} className="w-full h-full" />
                </div>

                {/* Right Panel */}
                <div
                    className={`bg-gray-800 text-white transition-all duration-300 ${rightPanelOpen ? 'w-64' : 'w-0'
                        } overflow-hidden`}
                >
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Right Panel</h2>
                        <div className="space-y-3">
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-sm font-medium">Cube</p>
                                <p className="text-xs text-gray-400 mt-1">Color: Cyan</p>
                                <p className="text-xs text-gray-400">Rotation: Active</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-sm font-medium">Torus</p>
                                <p className="text-xs text-gray-400 mt-1">Color: Pink</p>
                                <p className="text-xs text-gray-400">Rotation: Active</p>
                            </div>
                            <div className="bg-gray-700 p-3 rounded">
                                <p className="text-sm font-medium">Lighting</p>
                                <p className="text-xs text-gray-400 mt-1">Ambient + Point</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
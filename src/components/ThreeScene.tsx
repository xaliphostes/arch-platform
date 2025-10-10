import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useScene } from '../contexts/SceneContext'

import {
    BufferGeometry,
    createIsoContourLines,
    createIsoContoursFilled,
    Float32BufferAttribute,
    Uint32BufferAttribute,
    ColorScale
} from '../keplerlit'

import CameraControls from 'camera-controls'
import { GradientBackground } from '../keplerlit/GradientBackground'
import { createComplexGradient } from '../keplerlit/FixedImageBackground'

export const ThreeScene = () => {
    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<CameraControls | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const colorScaleRef = useRef<any | null>(null)

    // Mesh references
    const surfaceMeshRef = useRef<THREE.Mesh | null>(null)
    const contourMeshRef = useRef<THREE.Mesh | null>(null)
    const contourLinesRef = useRef<THREE.LineSegments | null>(null)

    // Geometry data
    const geometryDataRef = useRef<{ geometry: THREE.BufferGeometry; scalarField: number[] } | null>(null)

    const { displayMode, numContours, colorTable } = useScene()

    const clock = new THREE.Clock()

    // Initialize Three.js scene
    useEffect(() => {
        if (!mountRef.current) return


        CameraControls.install({ THREE: THREE })

        // Clean up any existing ColorScale instances first
        if (colorScaleRef.current) {
            colorScaleRef.current.destroy()
            colorScaleRef.current = null
        }

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0xaaaaaa)
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        )
        camera.position.set(3, 3, 3)
        camera.lookAt(0, 0, 0)
        camera.up.set( 0, 0, 1 );
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
        mountRef.current.appendChild(renderer.domElement)
        rendererRef.current = renderer

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.99)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(10, 10, 10)
        scene.add(directionalLight)

        // Setup the controls
        const controls = new CameraControls(camera, renderer.domElement);
        controls.applyCameraUp()
        controlsRef.current = controls

        //const gradient = new GradientBackground(scene, 'ocean')
        const background = createComplexGradient(scene, 'grayscale')

        // Initialize ColorScale
        // const colorStops = [
        //     { position: 0, color: '#0066cc' },
        //     { position: 0.5, color: '#ffff00' },
        //     { position: 1, color: '#cc0000' }
        // ]

        

        colorScaleRef.current = new ColorScale({
            canvas: renderer.domElement,
            x: mountRef.current.clientWidth - 100,
            y: 50,
            width: 30,
            height: 200,
            min: 0,
            max: 100,
            attributeName: 'Scalar Value',
            orientation: 'vertical',
            //colorStops: colorStops,
            colorMapName: 'Rainbow',
            autoRender: false // Let React control rendering
        })

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate)

            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();
            const updated = controls.update(delta);

            renderer.render(scene, camera)

            // Render ColorScale in animation loop
            if (colorScaleRef.current) {
                colorScaleRef.current.render()
            }
        }

        animate()

        const handleResize = () => {
            if (!mountRef.current || !cameraRef.current || !rendererRef.current) return

            const width = mountRef.current.clientWidth
            const height = mountRef.current.clientHeight

            cameraRef.current.aspect = width / height
            cameraRef.current.updateProjectionMatrix()
            rendererRef.current.setSize(width, height)

            // Update ColorScale position on resize
            if (colorScaleRef.current) {
                colorScaleRef.current.resize(width, height)
                const x = width - 100
                const y = 50
                colorScaleRef.current.updatePosition(x, y)
                colorScaleRef.current.updateSize(30, 200)
            }
        }
        window.addEventListener('resize', handleResize)

        // Generate initial surface
        generateSurface()

        return () => {
            window.removeEventListener('resize', handleResize)
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement)
            }
            if (colorScaleRef.current) {
                // Cleanup ColorScale if it has a dispose method
                if (typeof colorScaleRef.current.dispose === 'function') {
                    colorScaleRef.current.dispose()
                }
            }
            controls.dispose()
            renderer.dispose()
        }
    }, [])

    // Update contours when parameters change
    useEffect(() => {
        generateContours()
    }, [displayMode, numContours, colorTable])

    const createWaveSurface = (): [THREE.BufferGeometry, number[]] => {
        const width = 4 * 34
        const height = 4 * 34
        const geometry = new THREE.PlaneGeometry(4, 4, width - 1, height - 1)

        const positions = geometry.attributes.position.array
        const scalarField: number[] = []

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i] / 4
            const y = positions[i + 1] / 4

            const z = 0.5 * Math.sin(2 * Math.PI * x) * Math.cos(2 * Math.PI * y) +
                0.3 * Math.sin(4 * Math.PI * x) * Math.sin(3 * Math.PI * y)
            positions[i + 2] = z

            const scalar = Math.sqrt(x * x + y * y) + z
            scalarField.push(scalar)
        }

        geometry.attributes.position.needsUpdate = true
        geometry.computeVertexNormals()

        return [geometry, scalarField]
    }

    const generateIndices = (vertexCount: number): Uint32Array => {
        const indices: number[] = []
        for (let i = 0; i < vertexCount - 2; i += 3) {
            indices.push(i, i + 1, i + 2)
        }
        return new Uint32Array(indices)
    }

    const clearMeshes = () => {
        const meshes = [
            surfaceMeshRef.current,
            contourMeshRef.current,
            contourLinesRef.current
        ]

        meshes.forEach(mesh => {
            if (mesh && sceneRef.current) {
                sceneRef.current.remove(mesh)
                if (mesh.geometry) mesh.geometry.dispose()
                if ((mesh as any).material) (mesh as any).material.dispose()
            }
        })

        surfaceMeshRef.current = null
        contourMeshRef.current = null
        contourLinesRef.current = null
    }

    const generateSurface = () => {
        if (!sceneRef.current) return

        clearMeshes()

        const [geometry, scalarField] = createWaveSurface()
        geometryDataRef.current = { geometry, scalarField }

        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 0.3
        })
        const mesh = new THREE.Mesh(geometry, material)
        surfaceMeshRef.current = mesh
        sceneRef.current.add(mesh)

        // Update ColorScale range based on scalar field
        if (colorScaleRef.current && scalarField.length > 0) {
            const minVal = Math.min(...scalarField)
            const maxVal = Math.max(...scalarField)
            colorScaleRef.current.updateRange(minVal, maxVal)
        }

        generateContours()
    }

    const generateContours = () => {
        if (!sceneRef.current || !geometryDataRef.current) return

        // Clear existing contour meshes
        if (contourMeshRef.current) {
            sceneRef.current.remove(contourMeshRef.current)
            contourMeshRef.current.geometry.dispose();
            (contourMeshRef.current.material as THREE.Material).dispose()
            contourMeshRef.current = null
        }
        if (contourLinesRef.current) {
            sceneRef.current.remove(contourLinesRef.current)
            contourLinesRef.current.geometry.dispose();
            (contourLinesRef.current.material as THREE.Material).dispose()
            contourLinesRef.current = null
        }

        const { geometry, scalarField } = geometryDataRef.current

        // Convert to keplerlit format
        const positions = geometry.attributes.position.array
        const indices = geometry.index ?
            geometry.index.array : generateIndices(positions.length / 3)

        const keplerPositions = new Float32BufferAttribute(Array.from(positions), 3)
        const keplerIndices = new Uint32BufferAttribute(Array.from(indices), 1)

        const keplerGeometry = new BufferGeometry()
        keplerGeometry.setPositions(keplerPositions)
        keplerGeometry.setIndices(keplerIndices)

        // Calculate contour levels
        const minVal = Math.min(...scalarField)
        const maxVal = Math.max(...scalarField)

        // Update ColorScale range when contours are regenerated
        if (colorScaleRef.current) {
            colorScaleRef.current.updateRange(minVal, maxVal)
            colorScaleRef.current.setColorMap(colorTable)
        }

        const isoList: number[] = []
        for (let i = 0; i < numContours; i++) {
            isoList.push(minVal + (i / (numContours - 1)) * (maxVal - minVal))
        }

        try {
            // Generate filled contours
            if (displayMode === 'filled' || displayMode === 'both') {
                const result = createIsoContoursFilled(keplerGeometry, scalarField, isoList, {
                    lut: colorTable,
                    nbColors: 512
                })

                if (result) {
                    const meshGeometry = new THREE.BufferGeometry()
                    meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(result.position, 3))
                    meshGeometry.setIndex(new THREE.Uint32BufferAttribute(result.index, 1))

                    const colors = new Float32Array(result.color)
                    meshGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
                    meshGeometry.computeVertexNormals()

                    const material = new THREE.MeshPhongMaterial({
                        vertexColors: true,
                        side: THREE.DoubleSide,
                        wireframe: false,
                        flatShading: false,
                        polygonOffset: true,
                        polygonOffsetFactor: 0.5
                    })

                    const mesh = new THREE.Mesh(meshGeometry, material)
                    contourMeshRef.current = mesh
                    sceneRef.current.add(mesh)

                    if (surfaceMeshRef.current) {
                        sceneRef.current.remove(surfaceMeshRef.current)
                    }
                }
            }

            // Generate line contours
            if (displayMode === 'lines' || displayMode === 'both') {
                const result = createIsoContourLines(keplerGeometry, scalarField, isoList, '#000000', colorTable)

                if (result.positions.length > 0) {
                    const lineGeometry = new THREE.BufferGeometry()
                    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(result.positions, 3))

                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: 0x000000,
                        linewidth: 2
                    })

                    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
                    contourLinesRef.current = lines
                    sceneRef.current.add(lines)
                }
            }
        } catch (error) {
            console.error('Error generating contours:', error)
        }
    }

    return <div ref={mountRef} className="three-scene-container" />
}
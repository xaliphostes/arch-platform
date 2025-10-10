import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import { useScene } from '../contexts/SceneContext'
import {
    BufferGeometry,
    createIsoContourLines,
    createIsoContoursFilled,
    Float32BufferAttribute,
    Uint32BufferAttribute
} from '../keplerlit'

export const ThreeScene = () => {
    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<TrackballControls | null>(null)
    const animationIdRef = useRef<number | null>(null)

    // Mesh references
    const surfaceMeshRef = useRef<THREE.Mesh | null>(null)
    const contourMeshRef = useRef<THREE.Mesh | null>(null)
    const contourLinesRef = useRef<THREE.LineSegments | null>(null)

    // Geometry data
    const geometryDataRef = useRef<{ geometry: THREE.BufferGeometry; scalarField: number[] } | null>(null)

    const { displayMode, numContours, colorTable } = useScene()

    // Initialize Three.js scene
    useEffect(() => {
        if (!mountRef.current) return

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

        // Setup TrackballControls
        const controls = new TrackballControls(camera, renderer.domElement)
        controls.rotateSpeed = 1.0
        controls.zoomSpeed = 1.2
        controls.panSpeed = 0.8
        controlsRef.current = controls

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        const handleResize = () => {
            if (!mountRef.current || !cameraRef.current || !rendererRef.current) return

            const width = mountRef.current.clientWidth
            const height = mountRef.current.clientHeight

            cameraRef.current.aspect = width / height
            cameraRef.current.updateProjectionMatrix()
            rendererRef.current.setSize(width, height)
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
            color: 0x888888,
            transparent: false,
            opacity: 0.3
        })
        const mesh = new THREE.Mesh(geometry, material)
        surfaceMeshRef.current = mesh
        sceneRef.current.add(mesh)

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
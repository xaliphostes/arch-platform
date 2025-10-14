import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useScene } from '../contexts/SceneContext'
import { ModelLoader, PREDEFINED_MODELS, getAttributeNames, getAttributeSerie } from '../utils/ModelLoader'

import {
    BufferGeometry,
    createIsoContourLines,
    createIsoContoursFilled,
    Float32BufferAttribute,
    Uint32BufferAttribute,
    ColorScale
} from '../keplerlit'

import CameraControls from 'camera-controls'
import { createComplexGradient } from '../keplerlit/FixedImageBackground'

export const ThreeScene = () => {
    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<CameraControls | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const colorScaleRef = useRef<any | null>(null)
    const modelLoaderRef = useRef<ModelLoader | null>(null)

    // References for iso-contour meshes (separate from model meshes)
    const isoContourMeshesRef = useRef<Map<string, THREE.Mesh | THREE.LineSegments>>(new Map())

    const {
        attribute,
        setAttribute,
        setAvailableAttributes,
        displayMode,
        numContours,
        colorTable,
        selectedModel,
        loadedModelName,
        setLoadedModelName
    } = useScene()

    const clock = new THREE.Clock()

    // Initialize Three.js scene (only once)
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
            0.01,
            100000
        )
        camera.position.set(0, 0, 1)
        camera.lookAt(0, 0, 0)
        camera.up.set(0, 0, 1)
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
        const controls = new CameraControls(camera, renderer.domElement)
        controls.applyCameraUp()
        controlsRef.current = controls

        // Background
        const background = createComplexGradient(scene, 'grayscale')

        // Initialize ColorScale
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
            colorMapName: 'Rainbow',
            autoRender: false
        })

        // Initialize ModelLoader
        modelLoaderRef.current = new ModelLoader()

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate)

            const delta = clock.getDelta()
            const elapsed = clock.getElapsedTime()
            const updated = controls.update(delta)

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

        return () => {
            window.removeEventListener('resize', handleResize)
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement)
            }
            if (colorScaleRef.current) {
                if (typeof colorScaleRef.current.dispose === 'function') {
                    colorScaleRef.current.dispose()
                }
            }
            // Clear all iso-contour meshes
            clearIsoContourMeshes()

            if (modelLoaderRef.current && sceneRef.current) {
                modelLoaderRef.current.clearModels(sceneRef.current)
            }
            controls.dispose()
            renderer.dispose()
        }
    }, [])

    // Load model when selectedModel changes
    useEffect(() => {
        const loadModel = async () => {
            if (!sceneRef.current || !modelLoaderRef.current || !selectedModel || selectedModel === '') return

            const config = PREDEFINED_MODELS[selectedModel]
            if (!config) {
                console.error(`Model ${selectedModel} not found in PREDEFINED_MODELS`)
                return
            }

            // Clear previous model if it exists
            if (loadedModelName && loadedModelName !== config.name) {
                console.log(`Removing previous model: ${loadedModelName}`)
                modelLoaderRef.current.removeModel(loadedModelName, sceneRef.current)
                clearIsoContourMeshes()
            }

            try {
                console.log(`Loading model: ${config.name}`)
                const loadedModel = await modelLoaderRef.current.loadModel(config, sceneRef.current)
                setLoadedModelName(config.name)

                // Extract available attributes from the first file marked for iso-contouring
                const isoContourFile = loadedModel.files.find(f => f.file.isoContour === true)
                if (isoContourFile) {
                    console.log('ISO contour file found:', isoContourFile.file.name)
                    console.log('Number of dataframes:', isoContourFile.dataframes.length)
                    console.log('Number of managers:', isoContourFile.managers.length)
                    
                    const attributeNames = getAttributeNames(isoContourFile)
                    console.log('Extracted attribute names:', attributeNames)
                    
                    // Always include 'z' as a fallback
                    const availableAttrs = attributeNames.length > 0 ? ['z', ...attributeNames] : ['z']
                    setAvailableAttributes(availableAttrs)
                    
                    // Set default attribute to 'z'
                    setAttribute('z')
                    
                    console.log('Available attributes set to:', availableAttrs)
                } else {
                    console.log('No ISO contour file found in model')
                    setAvailableAttributes(['z'])
                    setAttribute('z')
                }

                if (cameraRef.current) {
                    cameraRef.current.position.set(0, 1, 1);
                }

                console.log(`Model loaded successfully: ${config.name}`)

                // Generate iso-contours for files marked with isoContour: true
                generateIsoContours()

            } catch (error) {
                console.error(`Failed to load model ${config.name}:`, error)
            }
        }

        if (selectedModel) {
            loadModel()
        }
    }, [selectedModel])

    // Update iso-contours when display parameters change
    useEffect(() => {
        if (loadedModelName) {
            generateIsoContours()
        }
    }, [displayMode, numContours, colorTable, loadedModelName, attribute])

    const clearIsoContourMeshes = () => {
        if (!sceneRef.current) return

        isoContourMeshesRef.current.forEach(mesh => {
            sceneRef.current!.remove(mesh)
            mesh.geometry.dispose()
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose())
            } else {
                mesh.material.dispose()
            }
        })
        isoContourMeshesRef.current.clear()
    }

    const generateIsoContours = () => {
        if (!sceneRef.current || !modelLoaderRef.current || !loadedModelName) return

        // Clear existing iso-contour meshes
        clearIsoContourMeshes()

        const loadedModel = modelLoaderRef.current.getModel(loadedModelName)
        if (!loadedModel) return

        // Find files marked for iso-contouring
        const isoContourFiles = loadedModel.files.filter(f => f.file.isoContour === true)

        if (isoContourFiles.length === 0) {
            console.log('No files marked for iso-contouring')
            return
        }

        console.log(`Generating iso-contours for ${isoContourFiles.length} file(s)`)

        isoContourFiles.forEach((fileData, fileIndex) => {
            const { file, dataframes, meshes, managers } = fileData

            if (meshes.length === 0 || dataframes.length === 0) {
                console.warn(`Skipping ${file.name}: missing meshes or dataframes`)
                return
            }

            try {
                // Get scalar field from selected attribute
                let scalarField: number[] = []
                
                if (attribute === 'z') {
                    // Use Z coordinates as fallback
                    const firstMesh = meshes[0]
                    const positions = firstMesh.geometry.attributes.position.array
                    for (let i = 0; i < positions.length; i += 3) {
                        scalarField.push(positions[i + 2])
                    }
                } else if (managers && managers.length > 0) {
                    // Use selected attribute from first Manager
                    const serie = getAttributeSerie(fileData, attribute)
                    if (serie && serie.array) {
                        scalarField = Array.from(serie.array)
                    } else {
                        console.warn(`Attribute ${attribute} not found, falling back to Z`)
                        // Fallback to Z
                        const firstMesh = meshes[0]
                        const positions = firstMesh.geometry.attributes.position.array
                        for (let i = 0; i < positions.length; i += 3) {
                            scalarField.push(positions[i + 2])
                        }
                    }
                } else {
                    console.warn(`No managers available for ${file.name}, using Z coordinates`)
                    const firstMesh = meshes[0]
                    const positions = firstMesh.geometry.attributes.position.array
                    for (let i = 0; i < positions.length; i += 3) {
                        scalarField.push(positions[i + 2])
                    }
                }

                if (scalarField.length === 0) {
                    console.warn(`No scalar field data for ${file.name}`)
                    return
                }

                // Get positions and indices from first mesh
                const firstMesh = meshes[0]
                const positionsArray = firstMesh.geometry.attributes.position.array
                const indicesArray = firstMesh.geometry.index?.array

                if (!indicesArray) {
                    console.warn(`No indices for ${file.name}`)
                    return
                }

                // Convert to keplerlit format
                const keplerPositions = new Float32BufferAttribute(Array.from(positionsArray), 3)
                const keplerIndices = new Uint32BufferAttribute(Array.from(indicesArray), 1)

                const keplerGeometry = new BufferGeometry()
                keplerGeometry.setPositions(keplerPositions)
                keplerGeometry.setIndices(keplerIndices)

                // Calculate contour levels
                const minVal = Math.min(...scalarField)
                const maxVal = Math.max(...scalarField)

                // Update ColorScale range
                if (colorScaleRef.current && fileIndex === 0) {
                    colorScaleRef.current.updateRange(minVal, maxVal)
                    colorScaleRef.current.setColorMap(colorTable)
                    colorScaleRef.current.updateAttributeName(attribute)
                }

                const isoList: number[] = []
                for (let i = 0; i < numContours; i++) {
                    isoList.push(minVal + (i / (numContours - 1)) * (maxVal - minVal))
                }

                console.log(`Generating contours for ${file.name} using attribute "${attribute}": ${isoList.length} levels`)

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

                        const contourMesh = new THREE.Mesh(meshGeometry, material)
                        contourMesh.name = `${file.name}_isocontours_filled`
                        sceneRef.current.add(contourMesh)
                        isoContourMeshesRef.current.set(`${file.name}_filled`, contourMesh)

                        // Hide the original meshes when showing iso-contours
                        meshes.forEach(mesh => mesh.visible = false)

                        console.log(`Created filled contours for ${file.name}`)
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
                        lines.name = `${file.name}_isocontours_lines`
                        sceneRef.current.add(lines)
                        isoContourMeshesRef.current.set(`${file.name}_lines`, lines)

                        console.log(`Created line contours for ${file.name}`)
                    }
                }

                // Show original meshes if only displaying lines
                if (displayMode === 'lines') {
                    meshes.forEach(mesh => mesh.visible = true)
                }

            } catch (error) {
                console.error(`Error generating contours for ${file.name}:`, error)
            }
        })
    }

    return <div ref={mountRef} className="three-scene-container" />
}
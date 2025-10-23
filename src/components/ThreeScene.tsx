import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useScene } from '../contexts/SceneContext'
import { ModelLoader, getAttributeNames, getAttributeSerie } from '../utils/ModelLoader'

import {
    BufferGeometry,
    createIsoContourLines,
    createIsoContoursFilled,
    Float32BufferAttribute,
    Uint32BufferAttribute,
    ColorScale
} from '../keplerlit'

// import CameraControls from 'camera-controls'
import { createComplexGradient } from '../keplerlit/FixedImageBackground'
import { TrackballControls } from 'three/examples/jsm/Addons.js'
import { PREDEFINED_MODELS } from '../models/predefinedModels'
import { ViewHelper2 } from '../keplerlit/ViewHelper2'
import { BoundingBoxAxesTroika } from '../keplerlit/BoundingBoxAxesTroika'

export const ThreeScene = () => {
    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const helperRef = useRef<ViewHelper2 | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const controlsRef = useRef<TrackballControls | null>(null)
    const animationIdRef = useRef<number | null>(null)
    const colorScaleRef = useRef<any | null>(null)
    const modelLoaderRef = useRef<ModelLoader | null>(null)
    const bboxHelperRef = useRef<BoundingBoxAxesTroika | null>(null)

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
        setLoadedModelName,
        selectedObject,
        fileVisualizationStates,
        setFileVisualizationState,
        visibilityStates,
        regenerationTrigger,
        modelLoaderRef: contextModelLoaderRef
    } = useScene()

    const clock = new THREE.Clock()

    // Initialize Three.js scene (only once)
    useEffect(() => {
        if (!mountRef.current) return

        // CameraControls.install({ THREE: THREE })

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

        const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 1.0);
        scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 2);
        dir.position.set(3, 5, 2);
        scene.add(dir);

        // const ambientLight = new THREE.AmbientLight(0xffffff, 0.99)
        // scene.add(ambientLight)
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        // directionalLight.position.set(10, 10, 10)
        // scene.add(directionalLight)

        // Setup the controls
        // const controls = new CameraControls(camera, renderer.domElement)
        const controls = new TrackballControls(camera, renderer.domElement)
        controls.rotateSpeed = 1.0
        controls.zoomSpeed = 1.2
        controls.panSpeed = 0.8
        // controls.applyCameraUp()
        controlsRef.current = controls

        const helper = new ViewHelper2(camera, renderer)
        helper.setControls(controls)
        helperRef.current = helper

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

        // Bbox around the model
        const bboxHelper = new BoundingBoxAxesTroika(scene, {
            origin: 'min',              // start at min corner
            billboardLabels: true,      // face labels toward the camera
            addAxisEndLabels: true,
            tickTarget: 5,
            fontSize: 0.03
        });
        bboxHelperRef.current = bboxHelper
        scene.add(bboxHelper);

        // Initialize ModelLoader
        modelLoaderRef.current = new ModelLoader()
        contextModelLoaderRef.current = modelLoaderRef.current

        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate)

            // const delta = clock.getDelta()
            // const elapsed = clock.getElapsedTime()
            const updated = controls.update()

            helper.update(); // keeps box in sync + billboarding

            renderer.render(scene, camera)
            helperRef.current?.render()

            // Render ColorScale in animation loop
            colorScaleRef.current?.render()
        }

        animate()

        const handleResize = () => {
            if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(width, height);

            // keep helper/canvas aligned
            helperRef.current?.update();
            helperRef.current?.updateOrientation();

            if (colorScaleRef.current) {
                colorScaleRef.current.resize(width, height);
                const x = width - 100;
                const y = 50;
                colorScaleRef.current.updatePosition(x, y);
                colorScaleRef.current.updateSize(30, 200);
            }
        }
        handleResize()

        window.addEventListener('resize', handleResize)

        // NEW: observe container size changes (panels opening/closing)
        // const ro = new ResizeObserver(() => handleResize());
        // ro.observe(mountRef.current);

        return () => {
            window.removeEventListener('resize', handleResize)
            // ro.disconnect();
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
                // console.log(`Removing previous model: ${loadedModelName}`)
                modelLoaderRef.current.removeModel(loadedModelName, sceneRef.current)
                clearIsoContourMeshes()
            }

            try {
                // console.log(`Loading model: ${config.name}`)
                const loadedModel = await modelLoaderRef.current.loadModel(config, sceneRef.current)
                setLoadedModelName(config.name)

                // Initialize all files to 'original' state
                loadedModel.files.forEach(fileData => {
                    setFileVisualizationState(fileData.file.path, 'original');
                });

                // Extract available attributes from the first file marked for iso-contouring
                const isoContourFile = loadedModel.files.find(f => f.file.isoContour === true)
                if (isoContourFile) {
                    // console.log('ISO contour file found:', isoContourFile.file.name)
                    // console.log('Number of dataframes:', isoContourFile.dataframes.length)
                    // console.log('Number of managers:', isoContourFile.managers.length)

                    const attributeNames = getAttributeNames(isoContourFile)
                    // console.log('Extracted attribute names:', attributeNames)

                    // Always include 'z' as a fallback
                    const availableAttrs = attributeNames.length > 0 ? ['z', ...attributeNames] : ['Ux']
                    setAvailableAttributes(availableAttrs)

                    // Set default attribute to 'z'
                    setAttribute('Ux')

                    // console.log('Available attributes set to:', availableAttrs)
                } else {
                    // console.log('No ISO contour file found in model')
                    setAvailableAttributes(['Ux'])
                    setAttribute('Ux')
                }

                if (cameraRef.current) {
                    cameraRef.current.position.set(0, 1, 1);
                }

                // console.log(`Model loaded successfully: ${config.name}`)

                // Generate iso-contours for files marked with isoContour: true
                generateIsoContours()
                bboxHelperRef.current?.setTarget(sceneRef.current)

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
    }, [displayMode, numContours, colorTable, loadedModelName, attribute, selectedObject, regenerationTrigger])

    // Apply per-file visibility to both original meshes and iso-contours
    // Updated visibility logic for per-mesh iso-contours
    // Replace the visibility useEffect with this version:

    useEffect(() => {
        if (!sceneRef.current || !modelLoaderRef.current || !loadedModelName) return
        const loadedModel = modelLoaderRef.current.getModel(loadedModelName)
        if (!loadedModel) return

        loadedModel.files.forEach(fileData => {
            const path = fileData.file.path
            const defaultVisible = fileData.file.visible !== false
            const shouldShow = visibilityStates.has(path) ? !!visibilityStates.get(path) : defaultVisible

            if (!shouldShow) {
                // Hide everything for this file (all meshes and their iso-contours)
                fileData.meshes.forEach((mesh, meshIndex) => {
                    mesh.visible = false
                    const filledKey = `${fileData.file.name}_mesh${meshIndex}_filled`
                    const linesKey = `${fileData.file.name}_mesh${meshIndex}_lines`
                    const filledMesh = isoContourMeshesRef.current.get(filledKey)
                    const linesMesh = isoContourMeshesRef.current.get(linesKey)
                    if (filledMesh) filledMesh.visible = false
                    if (linesMesh) linesMesh.visible = false
                })
                return
            }

            // Visible -> honor saved visualization state ('iso' vs 'original')
            const state = fileVisualizationStates.get(path)
            const showIso = state === 'iso'

            fileData.meshes.forEach((mesh, meshIndex) => {
                const filledKey = `${fileData.file.name}_mesh${meshIndex}_filled`
                const linesKey = `${fileData.file.name}_mesh${meshIndex}_lines`
                const filledMesh = isoContourMeshesRef.current.get(filledKey)
                const linesMesh = isoContourMeshesRef.current.get(linesKey)

                if (showIso) {
                    if (filledMesh) filledMesh.visible = (displayMode === 'filled' || displayMode === 'both')
                    if (linesMesh) linesMesh.visible = (displayMode === 'lines' || displayMode === 'both')
                    // Hide originals when iso is shown (unless lines-only mode, where originals are shown too)
                    mesh.visible = (displayMode === 'lines')
                } else {
                    // Show originals, hide iso layers
                    mesh.visible = true
                    if (filledMesh) filledMesh.visible = false
                    if (linesMesh) linesMesh.visible = false
                }
            })
        })
    }, [visibilityStates, loadedModelName, displayMode, fileVisualizationStates])

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
        if (!sceneRef.current || !modelLoaderRef.current || !loadedModelName) return;

        const loadedModel = modelLoaderRef.current.getModel(loadedModelName);
        if (!loadedModel) return;

        // Determine which files to process based on selection
        let filesToProcess = loadedModel.files.filter(f => f.file.isoContour === true);

        /*
        // If a specific object is selected, filter to only that object
        if (selectedObject && selectedObject !== loadedModelName) {
            const parts = selectedObject.split(':');

            // Specific file selected: "modelName:type:index"
            if (parts.length === 3) {
                const [model, type, indexStr] = parts;
                const fileIndex = parseInt(indexStr);
                const filesOfType = loadedModel.files.filter(f =>
                    (f.file.geologicalType || 'Unknown') === type && f.file.isoContour === true
                );
                filesToProcess = filesOfType[fileIndex] ? [filesOfType[fileIndex]] : [];
            }
            // Type group selected: "modelName:type"
            else if (parts.length === 2) {
                const [model, type] = parts;
                filesToProcess = filesToProcess.filter(f =>
                    (f.file.geologicalType || 'Unknown') === type
                );
            }
        }
        */

        // Process files that support iso-contours
        filesToProcess.forEach((fileData, fileIndex) => {
            const { file, dataframes, meshes, managers } = fileData;

            if (meshes.length === 0 || dataframes.length === 0) {
                console.warn(`Skipping ${file.name}: missing meshes or dataframes`);
                return;
            }

            // Process each mesh separately
            meshes.forEach((mesh, meshIndex) => {
                // Define keys for this specific mesh
                const filledKey = `${file.name}_mesh${meshIndex}_filled`
                const linesKey = `${file.name}_mesh${meshIndex}_lines`

                // REMOVE OLD MESHES FIRST (before creating new ones)
                const oldFilledMesh = isoContourMeshesRef.current.get(filledKey);
                const oldLinesMesh = isoContourMeshesRef.current.get(linesKey);

                if (oldFilledMesh) {
                    sceneRef.current!.remove(oldFilledMesh);
                    oldFilledMesh.geometry.dispose();
                    (oldFilledMesh.material as THREE.Material).dispose();
                    isoContourMeshesRef.current.delete(filledKey);
                }
                if (oldLinesMesh) {
                    sceneRef.current!.remove(oldLinesMesh);
                    oldLinesMesh.geometry.dispose();
                    (oldLinesMesh.material as THREE.Material).dispose();
                    isoContourMeshesRef.current.delete(linesKey);
                }

                try {
                    // Get scalar field from selected attribute for this specific mesh
                    let scalarField: number[] = []

                    if (attribute === 'z') {
                        const positions = mesh.geometry.attributes.position.array
                        for (let i = 0; i < positions.length; i += 3) {
                            scalarField.push(positions[i + 2])
                        }
                    } else if (managers && managers.length > meshIndex) {
                        // Use the corresponding manager for this mesh
                        const manager = managers[meshIndex]
                        const serie = manager.serie(0, attribute)
                        if (serie && serie.array) {
                            scalarField = Array.from(serie.array)
                        } else {
                            console.warn(`Attribute ${attribute} not found in mesh ${meshIndex}, falling back to Z`)
                            const positions = mesh.geometry.attributes.position.array
                            for (let i = 0; i < positions.length; i += 3) {
                                scalarField.push(positions[i + 2])
                            }
                        }
                    } else {
                        console.warn(`No manager available for mesh ${meshIndex}, using Z coordinates`)
                        const positions = mesh.geometry.attributes.position.array
                        for (let i = 0; i < positions.length; i += 3) {
                            scalarField.push(positions[i + 2])
                        }
                    }

                    if (scalarField.length === 0) {
                        console.warn(`No scalar field data for ${file.name} mesh ${meshIndex}`)
                        return
                    }

                    // Get positions and indices from current mesh
                    const positionsArray = mesh.geometry.attributes.position.array
                    const indicesArray = mesh.geometry.index?.array

                    if (!indicesArray) {
                        console.warn(`No indices for ${file.name} mesh ${meshIndex}`)
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

                    // Update ColorScale range (only for first mesh of first file)
                    if (colorScaleRef.current && fileIndex === 0 && meshIndex === 0) {
                        colorScaleRef.current.updateRange(minVal, maxVal)
                        colorScaleRef.current.setColorMap(colorTable)
                        colorScaleRef.current.updateAttributeName(attribute)
                    }

                    const isoList: number[] = []
                    for (let i = 0; i < numContours; i++) {
                        isoList.push(minVal + (i / (numContours - 1)) * (maxVal - minVal))
                    }

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
                            contourMesh.name = `${file.name}_mesh${meshIndex}_isocontours_filled`
                            sceneRef.current!.add(contourMesh)
                            isoContourMeshesRef.current.set(filledKey, contourMesh)

                            // Hide the original mesh when showing iso-contours
                            const shouldBeVisible = visibilityStates.has(file.path)
                                ? !!visibilityStates.get(file.path)
                                : (file.visible !== false);

                            if (shouldBeVisible) {
                                mesh.visible = false;
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
                            lines.name = `${file.name}_mesh${meshIndex}_isocontours_lines`
                            sceneRef.current!.add(lines)

                            isoContourMeshesRef.current.set(linesKey, lines)
                        }
                    }

                } catch (error) {
                    console.error(`Error generating contours for ${file.name} mesh ${meshIndex}:`, error)
                }
            });

            // SAVE STATE: Mark this file as showing iso-contours (after processing all meshes)
            setFileVisualizationState(file.path, 'iso');
        });
    }

    return <div ref={mountRef} className="three-scene-container" />
}
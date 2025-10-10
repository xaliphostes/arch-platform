import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

export const ThreeScene = () => {
    const mountRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!mountRef.current) return

        // Scene setup
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x1a1a1a)

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        )
        camera.position.z = 5

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
        mountRef.current.appendChild(renderer.domElement)

        // Controls setup
        const controls = new TrackballControls(camera, renderer.domElement)
        controls.rotateSpeed = 1.0
        controls.zoomSpeed = 1.2
        controls.panSpeed = 0.8

        // Grid helper
        const gridHelper = new THREE.GridHelper(10, 10)
        scene.add(gridHelper)

        // Axes helper
        const axesHelper = new THREE.AxesHelper(5)
        scene.add(axesHelper)

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(5, 5, 5)
        scene.add(directionalLight)

        // Add a test cube
        const geometry = new THREE.BoxGeometry()
        const material = new THREE.MeshStandardMaterial({ color: 0x4a9eff })
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)

        // Animation loop
        let animationFrameId: number
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }
        animate()

        // Handle window resize
        const handleResize = () => {
            if (!mountRef.current) return

            const width = mountRef.current.clientWidth
            const height = mountRef.current.clientHeight

            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationFrameId)
            controls.dispose()
            mountRef.current?.removeChild(renderer.domElement)
            renderer.dispose()
            geometry.dispose()
            material.dispose()
        }
    }, [])

    return <div ref={mountRef} className="three-scene-container" />
}
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

interface AnimationLoopProps {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
}

export const AnimationLoop = ({
    scene,
    camera,
    renderer,
}: AnimationLoopProps) => {
    const controlsRef = useRef<TrackballControls | null>(null)

    useEffect(() => {
        // Create controls inside the animation loop
        const controls = new TrackballControls(camera, renderer.domElement)
        controls.rotateSpeed = 1.0
        controls.zoomSpeed = 1.2
        controls.panSpeed = 0.8
        controlsRef.current = controls

        let animationFrameId: number

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)
            controls.update()
            renderer.render(scene, camera)
        }

        animate()

        return () => {
            cancelAnimationFrame(animationFrameId)
            controls.dispose()
        }
    }, [scene, camera, renderer])

    return null
}
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

interface ControlsProps {
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    onControlsReady?: (controls: TrackballControls) => void
}

export const Controls = ({ camera, renderer, onControlsReady }: ControlsProps) => {
    const controlsRef = useRef<TrackballControls | null>(null)

    useEffect(() => {
        const controls = new TrackballControls(camera, renderer.domElement)
        controls.rotateSpeed = 1.0
        controls.zoomSpeed = 1.2
        controls.panSpeed = 0.8
        controlsRef.current = controls

        if (onControlsReady) {
            onControlsReady(controls)
        }

        return () => {
            controls.dispose()
        }
    }, [camera, renderer, onControlsReady])

    return null
}
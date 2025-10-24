import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';
import { useScene } from '../../contexts/SceneContext';

interface GeneralDisplayPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * We avoid mutating mesh materials for wireframe by adding a LineSegments overlay
 * built from THREE.WireframeGeometry. Points are added as THREE.Points children.
 * Both overlays are attached as children of the original mesh and cleaned up on change.
 */
type OverlayStore = Map<THREE.Mesh, { wire?: THREE.LineSegments; points?: THREE.Points }>;

export const GeneralDisplayPanel: React.FC<GeneralDisplayPanelProps> = ({ isOpen, onToggle }) => {
    const {
        modelLoaderRef,
        loadedModelName,
        visibilityStates,
        modelReadyTick,
        regenerationTrigger,
    } = useScene();

    const [wireframe, setWireframe] = useState<boolean>(false);
    const [baseColor, setBaseColor] = useState<string>('#cccccc');
    const [ptColor, setPtColor] = useState<string>('#ffffff');
    const [wColor, setWColor] = useState<string>('#000000');
    const [showPoints, setShowPoints] = useState<boolean>(false);
    const [pointSize, setPointSize] = useState<number>(2.0);

    // per-mesh overlays we created so we can dispose/replace them safely
    const overlaysRef = useRef<OverlayStore>(new Map());

    const clearOverlays = () => {
        overlaysRef.current.forEach((ov, mesh) => {
            if (ov.wire) {
                if (ov.wire.parent === mesh) mesh.remove(ov.wire);
                (ov.wire.geometry as any)?.dispose?.();
                (ov.wire.material as any)?.dispose?.();
            }
            if (ov.points) {
                if (ov.points.parent === mesh) mesh.remove(ov.points);
                (ov.points.geometry as any)?.dispose?.();
                (ov.points.material as any)?.dispose?.();
            }
        });
        overlaysRef.current.clear();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => clearOverlays();
    }, []);

    const applyBaseColor = (color: string) => {
        if (!modelLoaderRef.current || !loadedModelName) return;
        const loaded = modelLoaderRef.current.getModel(loadedModelName);
        if (!loaded) return;

        loaded.files.forEach(fileData => {
            const { file, meshes } = fileData;
            if (!meshes || meshes.length === 0) return;

            const defaultVisible = file.visible !== false;
            const visible = visibilityStates.has(file.path) ? !!visibilityStates.get(file.path) : defaultVisible;
            if (!visible) return;

            meshes.forEach(mesh => {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                mats.forEach((m: any) => {
                    // If material supports a color, set it (vertexColors still apply as a multiplier)
                    if (m && 'color' in m && m.color && typeof m.color.set === 'function') {
                        m.color.set(color);
                        m.needsUpdate = true;
                    }
                });
            });
        });
    };

    const rebuildOverlays = () => {
        // Remove previous overlays
        clearOverlays();

        if (!modelLoaderRef.current || !loadedModelName) {
            return;
        }
        const loaded = modelLoaderRef.current.getModel(loadedModelName);
        if (!loaded) return;

        // Build overlays for each visible mesh
        loaded.files.forEach(fileData => {
            const { file, meshes } = fileData;
            if (!meshes || meshes.length === 0) return;

            const defaultVisible = file.visible !== false;
            const visible = visibilityStates.has(file.path) ? !!visibilityStates.get(file.path) : defaultVisible;
            if (!visible) return;

            meshes.forEach(mesh => {
                const entry: { wire?: THREE.LineSegments; points?: THREE.Points } = {};

                // Validate geometry before processing
                const posAttr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
                if (!posAttr) {
                    console.warn(`Skipping mesh ${mesh.name}: no position attribute`);
                    return;
                }

                // Check for NaN values in positions
                const positions = posAttr.array;
                let hasNaN = false;
                for (let i = 0; i < positions.length; i++) {
                    if (!isFinite(positions[i])) {
                        hasNaN = true;
                        break;
                    }
                }

                if (hasNaN) {
                    alert(`Skipping mesh ${mesh.name}: contains NaN or infinite values in positions`);
                    return;
                }

                // --- Wireframe overlay ---
                if (wireframe) {
                    try {
                        const wireGeo = new THREE.WireframeGeometry(mesh.geometry);
                        const wireMat = new THREE.LineBasicMaterial({
                            /* default color */
                            color: wColor,
                            depthTest: true
                        });
                        const wire = new THREE.LineSegments(wireGeo, wireMat);
                        wire.name = `${file.name}_wireframe`;
                        mesh.add(wire);
                        entry.wire = wire;
                    } catch (error) {
                        console.error(`Failed to create wireframe for ${mesh.name}:`, error);
                    }
                }
                // --- Points overlay ---
                if (showPoints) {
                    if (posAttr) {
                        try {
                            // We share the position buffer by making a shallow geometry that references it
                            const ptsGeo = new THREE.BufferGeometry();
                            ptsGeo.setAttribute('position', posAttr);
                            const ptsMat = new THREE.PointsMaterial({
                                size: pointSize,
                                sizeAttenuation: false,
                                color: ptColor
                            });
                            const pts = new THREE.Points(ptsGeo, ptsMat);
                            pts.name = `${file.name}_points`;
                            mesh.add(pts);
                            entry.points = pts;
                        } catch (error) {
                            console.error(`Failed to create points for ${mesh.name}:`, error);
                        }
                    }
                }
                if (entry.wire || entry.points) overlaysRef.current.set(mesh, entry);
            });
        });

        // Note: We don't call triggerRegeneration here as wireframe/points overlays
        // are purely visual additions and don't affect iso-contour generation
    };

    // Apply color immediately when it changes
    useEffect(() => {
        applyBaseColor(baseColor);
        // we do not need to rebuild overlays to change color; it affects existing mesh materials
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseColor, loadedModelName, visibilityStates]);

    // Rebuild overlays whenever toggles/sizes or model/visibility change
    useEffect(() => {
        rebuildOverlays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        wireframe,
        showPoints,
        pointSize,
        loadedModelName,
        visibilityStates,
        modelReadyTick,        // ensure first load is handled
        regenerationTrigger    // if geometry updates after stress changes
    ]);

    return (
        <CollapsibleSubPanel title="General Display" isOpen={isOpen} onToggle={onToggle}>

            <div className="control-group horizontal" style={{ marginBottom: 6 }}>
                <label>Base color</label>
                <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    disabled={!loadedModelName}
                    style={{ width: 48, height: 24, padding: 0, border: 'none', background: 'transparent' }}
                />
            </div>

            <div className="control-group horizontal" style={{ marginBottom: 6 }}>
                <label>Wireframe</label>
                <input
                    type="checkbox"
                    checked={wireframe}
                    onChange={e => setWireframe(e.target.checked)}
                    disabled={!loadedModelName}
                />
                <input
                    type="color"
                    value={wColor}
                    onChange={(e) => { setWColor(e.target.value); rebuildOverlays() }}
                    disabled={!loadedModelName}
                    style={{ width: 48, height: 24, padding: 0, border: 'none', background: 'transparent' }}
                />
            </div>

            <div className="control-group horizontal" style={{ marginBottom: 6 }}>
                <label>Show points</label>
                <input
                    type="checkbox"
                    checked={showPoints}
                    onChange={e => setShowPoints(e.target.checked)}
                    disabled={!loadedModelName}
                />
                <input
                    type="color"
                    value={ptColor}
                    onChange={(e) => { setPtColor(e.target.value); rebuildOverlays() }}
                    disabled={!loadedModelName}
                    style={{ width: 48, height: 24, padding: 0, border: 'none', background: 'transparent' }}
                />
            </div>

            <div className="control-group horizontal">
                <label>Point size</label>
                <input
                    type="text"
                    value={pointSize}
                    onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) setPointSize(v);
                    }}
                    style={{ width: 70 }}
                    disabled={!loadedModelName || !showPoints}
                />
            </div>
        </CollapsibleSubPanel>
    );
};
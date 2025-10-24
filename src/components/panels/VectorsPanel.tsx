import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';
import { useScene } from '../../contexts/SceneContext';

interface VectorsPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * A lightweight glyph: either a short line segment or a small ArrowHelper.
 * We default to line segments for performance; ArrowHelper is optional.
 */
type GlyphMode = 'lines' | 'arrows';

type GlyphStore = Map<THREE.Mesh, THREE.Object3D[]>; // children we added per mesh

export const VectorsPanel: React.FC<VectorsPanelProps> = ({ isOpen, onToggle }) => {
    const {
        modelLoaderRef,
        loadedModelName,
        visibilityStates,             // to respect layer visibility
        regenerationTrigger,
        modelReadyTick
    } = useScene();

    const [enabled, setEnabled] = useState(false);
    const [attribute, setAttribute] = useState<string>('');
    const [vectorAttrs, setVectorAttrs] = useState<string[]>([]);
    const [scale, setScale] = useState<number>(1.0);
    const [decimate, setDecimate] = useState<number>(50); // sample every Nth vertex
    const [mode, setMode] = useState<GlyphMode>('lines');
    const [maxGlyphsPerMesh, setMaxGlyphsPerMesh] = useState<number>(5000);

    // Track glyph objects we add so we can remove/replace them cleanly
    const glyphStoreRef = useRef<GlyphStore>(new Map());

    // Collect available vector attributes (similar to DeformPanel) 
    useEffect(() => {
        if (!modelReadyTick) return; // if model not ready yet, don't probe

        if (!modelLoaderRef.current || !loadedModelName) {
            setVectorAttrs([]);
            setAttribute('');
            return;
        }
        const loaded = modelLoaderRef.current.getModel(loadedModelName);
        if (!loaded || !loaded.files?.length) {
            setVectorAttrs([]);
            setAttribute('');
            return;
        }
        // Probe the first file's first manager for names and detect xyz triplets
        const firstFile = loaded.files[0];
        const manager = firstFile?.managers?.[0];
        const vectors = manager?.names?.(3) || [];

        setVectorAttrs(vectors);
        if (!attribute && vectors.length) {
            setAttribute(vectors[0]);
        }
    }, [modelReadyTick, loadedModelName, modelLoaderRef]);

    // Cleanup helper: remove all glyph children we added
    const clearAllGlyphs = () => {
        glyphStoreRef.current.forEach((objs, mesh) => {
            objs.forEach(o => {
                if (o.parent === mesh) mesh.remove(o);
                // dispose
                if ((o as any).geometry) (o as any).geometry.dispose?.();
                if ((o as any).material) {
                    const mat = (o as any).material;
                    if (Array.isArray(mat)) mat.forEach(m => m.dispose?.());
                    else mat.dispose?.();
                }
            });
        });
        glyphStoreRef.current.clear();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllGlyphs();
        };
    }, []);

    const canDraw = useMemo(() => {
        return Boolean(modelLoaderRef.current && loadedModelName && attribute && enabled && decimate >= 1);
    }, [modelLoaderRef, loadedModelName, attribute, enabled, decimate]);

    const rebuildGlyphs = () => {
        if (!canDraw) {
            clearAllGlyphs();
            return;
        }
        const loader = modelLoaderRef.current!;
        const loaded = loader.getModel(loadedModelName!);
        if (!loaded) return;

        // Remove previous glyphs, we're rebuilding
        clearAllGlyphs();

        // For each file/mesh, build glyphs if the file is visible
        loaded.files.forEach(fileData => {
            const { file, managers, meshes } = fileData;
            if (!meshes?.length || !managers?.length) return;

            // Respect checkbox visibility (default true unless overridden)
            const defaultVisible = file.visible !== false;
            const shouldShow = visibilityStates.has(file.path)
                ? !!visibilityStates.get(file.path)
                : defaultVisible;

            if (!shouldShow) return;

            meshes.forEach((mesh, idx) => {
                const manager = managers[idx] ?? managers[0];
                if (!manager) return;

                // Pull vector components
                const v = manager.serie(3, attribute)
                if (!v) return

                // Source positions from the mesh geometry
                const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute | undefined;
                if (!posAttr) return;

                const p = posAttr.array as Float32Array;
                const nVerts = p.length / 3;

                // Determine sampling step to cap glyph count
                const stepBase = Math.max(1, Math.floor(decimate));
                const estimated = Math.ceil(nVerts / stepBase);
                const step = estimated > maxGlyphsPerMesh ? Math.ceil(nVerts / maxGlyphsPerMesh) : stepBase;

                const created: THREE.Object3D[] = [];

                if (mode === 'lines') {
                    // Build one big LineSegments per mesh for performance
                    // Each glyph is two points (start, end)
                    const segs = Math.floor(nVerts / step);
                    const linePositions = new Float32Array(segs * 2 * 3);

                    let w = 0;
                    for (let i = 0; i < nVerts; i += step) {
                        const x = p[3 * i], y = p[3 * i + 1], z = p[3 * i + 2];
                        const d = v.itemAt(i / 3)
                        linePositions[w++] = x;
                        linePositions[w++] = y;
                        linePositions[w++] = z;
                        linePositions[w++] = x + d[0] * scale;
                        linePositions[w++] = y + d[1] * scale;
                        linePositions[w++] = z + d[2] * scale;
                        // console.log(d, scale)
                    }

                    const geo = new THREE.BufferGeometry();
                    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
                    const mat = new THREE.LineBasicMaterial({ linewidth: 1 });
                    const lines = new THREE.LineSegments(geo, mat);
                    lines.name = `${file.name}_mesh${idx}_vectors_lines`;
                    // Attach to the mesh so it inherits transforms and no scene ref is required
                    mesh.add(lines);
                    created.push(lines);
                } else {
                    // Arrow helpers (heavier): create a small ArrowHelper per sample
                    const root = new THREE.Group();
                    root.name = `${file.name}_mesh${idx}_vectors_arrows`;

                    for (let i = 0; i < nVerts; i += step) {
                        const x = p[3 * i], y = p[3 * i + 1], z = p[3 * i + 2];
                        const d = v.itemAt(i / 3)
                        const dx = d[0]
                        const dy = d[1]
                        const dz = d[2]
                        const dir = new THREE.Vector3(dx, dy, dz);
                        if (dir.lengthSq() === 0) continue;
                        dir.normalize();
                        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) * scale;

                        // ArrowHelper: dir, origin, length
                        const ah = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), len);
                        root.add(ah);
                    }

                    mesh.add(root);
                    created.push(root);
                }

                glyphStoreRef.current.set(mesh, created);
            });
        });

        // Note: We don't call triggerRegeneration here as vector glyphs
        // are purely visual additions and don't affect iso-contour generation
    };

    // Rebuild glyphs whenever inputs change
    useEffect(() => {
        rebuildGlyphs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        enabled, attribute, scale, decimate, mode, loadedModelName, visibilityStates,
        modelReadyTick,        // <-- rebuild on first load
        regenerationTrigger    // <-- rebuild when stress recomputes

    ]);

    // If a layer is toggled off elsewhere, our effect above will remove/skip it.
    // If you need to also react when model internals update, you can hook into your
    // existing regenerationTrigger from context and include it in deps.

    return (
        <CollapsibleSubPanel title="Vectors" isOpen={isOpen} onToggle={onToggle}>
            <div className="control-group horizontal" style={{ marginBottom: 8 }}>
                <label>Enable vectors</label>
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    disabled={vectorAttrs.length === 0}
                />
            </div>

            <div className="control-group">
                <label>Vector Field</label>
                <select
                    value={attribute}
                    onChange={(e) => setAttribute(e.target.value)}
                    disabled={!enabled || vectorAttrs.length === 0}
                >
                    {vectorAttrs.length === 0 ? (
                        <option value="">No vector fields available</option>
                    ) : (
                        vectorAttrs.map(v => <option key={v} value={v}>{v}</option>)
                    )}
                </select>
            </div>

            <div className="control-group">
                <label>Glyph Type</label>
                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as GlyphMode)}
                    disabled={!enabled}
                >
                    <option value="lines">Line segments (fast)</option>
                    <option value="arrows">Arrows (heavier)</option>
                </select>
            </div>

            <div className="control-group horizontal">
                <label>Scale: {scale.toFixed(2)}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* <input
                        type="range"
                        min="0"
                        max="1000"
                        step="1"
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        style={{ flex: 1 }}
                        disabled={!enabled || !attribute}
                    /> */}
                    <input
                        type="text"
                        value={scale}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setScale(isNaN(val) ? 0 : val);  // or leave undefined/null if preferred
                        }}
                        style={{ width: 70 }}
                        disabled={!enabled || !attribute}
                    />
                </div>
            </div>

            <div className="control-group horizontal">
                <label>Decimate: every {decimate}ᵗʰ vertex</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="range"
                        min="1"
                        max="500"
                        step="1"
                        value={decimate}
                        onChange={(e) => setDecimate(Number(e.target.value))}
                        style={{ flex: 1 }}
                        disabled={!enabled || !attribute}
                    />
                    <input
                        type="number"
                        min="1"
                        max="500"
                        step="1"
                        value={decimate}
                        onChange={(e) => setDecimate(Number(e.target.value))}
                        style={{ width: 70 }}
                        disabled={!enabled || !attribute}
                    />
                </div>
            </div>

            <div className="control-group horizontal">
                <label>Max glyphs / mesh</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                        type="number"
                        min="100"
                        max="20000"
                        step="100"
                        value={maxGlyphsPerMesh}
                        onChange={(e) => setMaxGlyphsPerMesh(Number(e.target.value))}
                        style={{ width: 100 }}
                        disabled={!enabled || !attribute}
                    />
                </div>
            </div>
        </CollapsibleSubPanel>
    );
};
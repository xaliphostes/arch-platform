import React, { useState, useEffect } from 'react';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';
import { useScene } from '../../contexts/SceneContext';

interface DeformPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const DeformPanel: React.FC<DeformPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        modelLoaderRef,
        loadedModelName,
        availableAttributes,
        triggerRegeneration
    } = useScene();

    const [deformEnabled, setDeformEnabled] = useState(false);
    const [deformScale, setDeformScale] = useState(10);
    const [deformAttribute, setDeformAttribute] = useState<string>('');
    const [vectorAttributes, setVectorAttributes] = useState<string[]>([]);

    // Extract available vector attributes (3D) from the loaded model
    useEffect(() => {
        if (!modelLoaderRef.current || !loadedModelName) {
            setVectorAttributes([]);
            return;
        }

        const loadedModel = modelLoaderRef.current.getModel(loadedModelName);
        if (!loadedModel) {
            setVectorAttributes([]);
            return;
        }

        // Get vector attributes from the first file's first manager
        const firstFile = loadedModel.files[0];
        if (firstFile?.managers && firstFile.managers.length > 0) {
            const manager = firstFile.managers[0];
            const names = manager.names(0) || [];
            
            // Filter for vector attributes (those with x, y, z components)
            const vectors = names.filter(name => {
                const serieX = manager.serie(0, `${name}x`);
                const serieY = manager.serie(0, `${name}y`);
                const serieZ = manager.serie(0, `${name}z`);
                return serieX && serieY && serieZ;
            });

            setVectorAttributes(vectors);
            if (vectors.length > 0 && !deformAttribute) {
                setDeformAttribute(vectors[0]);
            }
        }
    }, [loadedModelName, modelLoaderRef, availableAttributes]);

    /**
     * Apply deformation to all meshes in the loaded model
     */
    const applyDeformation = (scale: number, attributeName: string) => {
        if (!modelLoaderRef.current || !loadedModelName || !attributeName) return;

        const loadedModel = modelLoaderRef.current.getModel(loadedModelName);
        if (!loadedModel) return;

        loadedModel.files.forEach(fileData => {
            const { meshes, managers, dataframesUser } = fileData;

            if (!managers || managers.length === 0 || !dataframesUser || dataframesUser.length === 0) {
                return;
            }

            // Process each mesh with its corresponding dataframe
            meshes.forEach((mesh, index) => {
                if (index >= managers.length || index >= dataframesUser.length) return;

                const manager = managers[index];
                const udf = dataframesUser[index];

                // Get the original positions
                const originalPositions = udf.series.positions?.array as Float32Array;
                if (!originalPositions) return;

                // Get vector field components
                const vectorX = manager.serie(0, `${attributeName}x`);
                const vectorY = manager.serie(0, `${attributeName}y`);
                const vectorZ = manager.serie(0, `${attributeName}z`);

                if (!vectorX || !vectorY || !vectorZ) {
                    console.warn(`Vector field ${attributeName} not found for mesh ${mesh.name}`);
                    return;
                }

                // Create deformed positions
                const deformedPositions = new Float32Array(originalPositions.length);
                const scaleFactor = scale / 100; // Normalize scale to 0-1 range

                for (let i = 0; i < originalPositions.length; i += 3) {
                    const vertexIndex = i / 3;

                    // Get displacement vector
                    const dx = vectorX.array[vertexIndex] || 0;
                    const dy = vectorY.array[vertexIndex] || 0;
                    const dz = vectorZ.array[vertexIndex] || 0;

                    // Apply scaled deformation
                    deformedPositions[i] = originalPositions[i] + dx * scaleFactor;
                    deformedPositions[i + 1] = originalPositions[i + 1] + dy * scaleFactor;
                    deformedPositions[i + 2] = originalPositions[i + 2] + dz * scaleFactor;
                }

                // Update mesh geometry
                const positionAttribute = mesh.geometry.attributes.position;
                positionAttribute.array.set(deformedPositions);
                positionAttribute.needsUpdate = true;

                // Recompute normals for proper lighting
                mesh.geometry.computeVertexNormals();
                mesh.geometry.computeBoundingBox();
                mesh.geometry.computeBoundingSphere();
            });
        });

        // Trigger view update
        triggerRegeneration();
    };

    /**
     * Handle enable/disable deformation
     */
    const handleDeformToggle = (enabled: boolean) => {
        setDeformEnabled(enabled);
        if (enabled && deformAttribute) {
            applyDeformation(deformScale, deformAttribute);
        } else {
            // Reset to original positions when disabled
            applyDeformation(0, deformAttribute);
        }
    };

    /**
     * Handle scale change
     */
    const handleScaleChange = (newScale: number) => {
        setDeformScale(newScale);
        if (deformEnabled && deformAttribute) {
            applyDeformation(newScale, deformAttribute);
        }
    };

    /**
     * Handle attribute change
     */
    const handleAttributeChange = (newAttribute: string) => {
        setDeformAttribute(newAttribute);
        if (deformEnabled) {
            applyDeformation(deformScale, newAttribute);
        }
    };

    return (
        <CollapsibleSubPanel title="Deform" isOpen={isOpen} onToggle={onToggle}>
            
            {/* <div className="control-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={deformEnabled}
                        onChange={(e) => handleDeformToggle(e.target.checked)}
                        disabled={vectorAttributes.length === 0}
                    />
                    <span>Enable deform</span>
                </label>
            </div> */}
            <div className="control-group horizontal" style={{ marginBottom: 8 }}>
                <label>Enable iso-contours</label>
                <input
                    type="checkbox"
                    checked={deformEnabled}
                    onChange={(e) => handleDeformToggle(e.target.checked)}
                    disabled={vectorAttributes.length === 0}
                />
            </div>

            {/* Vector Field Selection */}
            <div className="control-group">
                <label>Vector Field</label>
                <select
                    value={deformAttribute}
                    onChange={(e) => handleAttributeChange(e.target.value)}
                    disabled={!deformEnabled || vectorAttributes.length === 0}
                >
                    {vectorAttributes.length === 0 ? (
                        <option value="">No vector fields available</option>
                    ) : (
                        vectorAttributes.map(attr => (
                            <option key={attr} value={attr}>
                                {attr}
                            </option>
                        ))
                    )}
                </select>
            </div>

            {/* Deformation Scale Control */}
            <div className="control-group horizontal">
                <label>Scale: {deformScale}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={deformScale}
                        onChange={(e) => handleScaleChange(Number(e.target.value))}
                        style={{ flex: 1 }}
                        disabled={!deformEnabled || !deformAttribute || vectorAttributes.length === 0}
                    />
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={deformScale}
                        onChange={(e) => handleScaleChange(Number(e.target.value))}
                        style={{ width: '70px' }}
                        disabled={!deformEnabled || !deformAttribute || vectorAttributes.length === 0}
                    />
                </div>
            </div>

            {/* Reset Button */}
            <div className="control-group">
                <button 
                    onClick={() => handleScaleChange(0)}
                    disabled={!deformEnabled || !deformAttribute || vectorAttributes.length === 0}
                >
                    Reset Deformation
                </button>
            </div>

        </CollapsibleSubPanel>
    );
};
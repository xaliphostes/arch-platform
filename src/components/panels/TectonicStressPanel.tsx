import React, { useMemo } from 'react';
import { useScene } from '../../contexts/SceneContext';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';
import { doWeightedSum } from '../../utils/ModelLoader';

interface TectonicStressPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

/**
 * Gets the tectonic stress regime based on R value
 * @param r - R parameter value (0-3)
 * @returns Regime name and color
 */
const getStressRegime = (r: number): { name: string; color: string } => {
    if (r >= 0 && r <= 1) {
        return { name: 'Normal', color: '#0095ffff' };
    } else if (r > 1 && r <= 2) {
        return { name: 'Strike-slip', color: '#00ff1aff' };
    } else if (r > 2 && r <= 3) {
        return { name: 'Reverse', color: '#ff1100ff' };
    }
    return { name: 'Unknown', color: '#999999' };
};

export const TectonicStressPanel: React.FC<TectonicStressPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        stressR,
        setStressR,
        stressTheta,
        setStressTheta,
        modelLoaderRef,
        loadedModelName,
        triggerRegeneration
    } = useScene();

    // Calculate regime based on R value
    const regime = useMemo(() => getStressRegime(stressR), [stressR]);

    /**
     * Handle R parameter change
     * Applies weighted sum to all loaded files and triggers regeneration
     */
    const handleRChange = (newR: number) => {
        setStressR(newR);

        // Apply doWeightedSum to all files in the loaded model
        if (modelLoaderRef.current && loadedModelName) {
            const loadedModel = modelLoaderRef.current.getModel(loadedModelName);

            if (loadedModel) {
                loadedModel.files.forEach(fileData => {
                    // Call doWeightedSum for each file
                    doWeightedSum(fileData, stressTheta, stressR);
                });

                // Trigger regeneration of iso-contours and view
                triggerRegeneration();
            }
        }
    };

    /**
     * Handle Theta parameter change
     * Similar to R parameter handling
     */
    const handleThetaChange = (newTheta: number) => {
        setStressTheta(newTheta);

        // Apply doWeightedSum to all files in the loaded model
        if (modelLoaderRef.current && loadedModelName) {
            const loadedModel = modelLoaderRef.current.getModel(loadedModelName);

            if (loadedModel) {
                loadedModel.files.forEach(fileData => {
                    doWeightedSum(fileData, stressTheta, stressR);
                });

                // Trigger regeneration
                triggerRegeneration();
            }
        }
    };

    return (
        <CollapsibleSubPanel title="Tectonic Stress" isOpen={isOpen} onToggle={onToggle}>

            {/* Regime Display */}
            <div>
                <span style={{ fontSize: '12px', color: '#aaa' }}>Regime: </span>
                <span style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: regime.color
                }}>
                    {regime.name}
                </span>
            </div>

            {/* R Parameter Control */}
            <div className="control-group horizontal">
                <label>R: {stressR.toFixed(2)}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={stressR}
                        onChange={(e) => handleRChange(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="3"
                        step="0.1"
                        value={stressR}
                        onChange={(e) => handleRChange(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>

            {/* Theta Parameter Control */}
            <div className="control-group horizontal">
                <label>θ: {stressTheta.toFixed(0)}°</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="180"
                        step="1"
                        value={stressTheta}
                        onChange={(e) => handleThetaChange(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="180"
                        step="1"
                        value={stressTheta}
                        onChange={(e) => handleThetaChange(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>

        </CollapsibleSubPanel>
    );
};

// ============================================================
// Alternative: More Compact Version
// ============================================================

export const TectonicStressPanelCompact: React.FC<TectonicStressPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        stressR,
        setStressR,
        stressTheta,
        setStressTheta,
        modelLoaderRef,
        loadedModelName,
        triggerRegeneration
    } = useScene();

    const regime = useMemo(() => getStressRegime(stressR), [stressR]);

    const handleRChange = (newR: number) => {
        setStressR(newR);
        if (modelLoaderRef.current && loadedModelName) {
            const loadedModel = modelLoaderRef.current.getModel(loadedModelName);
            if (loadedModel) {
                loadedModel.files.forEach(fileData => doWeightedSum(fileData, stressTheta, stressR));
                triggerRegeneration();
            }
        }
    };

    const handleThetaChange = (newTheta: number) => {
        setStressTheta(newTheta);
        if (modelLoaderRef.current && loadedModelName) {
            const loadedModel = modelLoaderRef.current.getModel(loadedModelName);
            if (loadedModel) {
                loadedModel.files.forEach(fileData => doWeightedSum(fileData, stressTheta, stressR));
                triggerRegeneration();
            }
        }
    };

    return (
        <CollapsibleSubPanel title="Tectonic Stress" isOpen={isOpen} onToggle={onToggle}>

            {/* R Parameter with inline Regime display */}
            <div className="control-group horizontal">
                <label>
                    R: {stressR.toFixed(2)}
                    <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: regime.color,
                        backgroundColor: `${regime.color}20`,
                        borderRadius: '3px'
                    }}>
                        {regime.name}
                    </span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={stressR}
                        onChange={(e) => handleRChange(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="3"
                        step="0.1"
                        value={stressR}
                        onChange={(e) => handleRChange(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>

            <div className="control-group horizontal">
                <label>θ: {stressTheta.toFixed(0)}°</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="180"
                        step="1"
                        value={stressTheta}
                        onChange={(e) => handleThetaChange(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="180"
                        step="1"
                        value={stressTheta}
                        onChange={(e) => handleThetaChange(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>

        </CollapsibleSubPanel>
    );
};
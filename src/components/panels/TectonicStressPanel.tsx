import React, { useMemo } from 'react';
import { useScene } from '../../contexts/SceneContext';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';

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
        return { name: 'Normal', color: '#0095ffff' }; // Green
    } else if (r > 1 && r <= 2) {
        return { name: 'Strike-slip', color: '#00ff1aff' }; // Orange
    } else if (r > 2 && r <= 3) {
        return { name: 'Reverse', color: '#ff1100ff' }; // Red
    }
    return { name: 'Unknown', color: '#999999' }; // Gray fallback
};

export const TectonicStressPanel: React.FC<TectonicStressPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        stressR,
        setStressR,
        stressTheta,
        setStressTheta
    } = useScene();

    // Calculate regime based on R value
    const regime = useMemo(() => getStressRegime(stressR), [stressR]);

    return (
        <CollapsibleSubPanel title="Tectonic Stress" isOpen={isOpen} onToggle={onToggle}>

            {/* Regime Display */}
            <div >
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
                        onChange={(e) => setStressR(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="3"
                        step="0.1"
                        value={stressR}
                        onChange={(e) => setStressR(Number(e.target.value))}
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
                        onChange={(e) => setStressTheta(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="180"
                        step="1"
                        value={stressTheta}
                        onChange={(e) => setStressTheta(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>

            {/* Optional: Visual indicator on the slider */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#666',
                marginTop: '8px',
                paddingLeft: '8px',
                paddingRight: '8px'
            }}>
                <span style={{ color: '#4CAF50' }}>Normal (0-1)</span>
                <span style={{ color: '#FF9800' }}>Strike-slip (1-2)</span>
                <span style={{ color: '#F44336' }}>Reverse (2-3)</span>
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
        setStressTheta
    } = useScene();

    const regime = useMemo(() => getStressRegime(stressR), [stressR]);

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
                        onChange={(e) => setStressR(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="3"
                        step="0.1"
                        value={stressR}
                        onChange={(e) => setStressR(Number(e.target.value))}
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
                        onChange={(e) => setStressTheta(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="180"
                        step="1"
                        value={stressTheta}
                        onChange={(e) => setStressTheta(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>

        </CollapsibleSubPanel>
    );
};

import React from 'react';
import { useScene } from '../../contexts/SceneContext';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';

interface TectonicStressPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

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

    return (
        <CollapsibleSubPanel title="Tectonic Stress" isOpen={isOpen} onToggle={onToggle}>
            <div className="control-group">
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

            <div className="control-group">
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
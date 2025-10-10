import React from 'react';
import { useScene } from '../../contexts/SceneContext';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';

interface PressurePanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const PressurePanel: React.FC<PressurePanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        stressPressure,
        setStressPressure
    } = useScene();

    return (
        <CollapsibleSubPanel title="Pressures" isOpen={isOpen} onToggle={onToggle}>
            <div className="control-group">
                <label>Pressure: {stressPressure.toFixed(0)}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={stressPressure}
                        onChange={(e) => setStressPressure(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={stressPressure}
                        onChange={(e) => setStressPressure(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>
        </CollapsibleSubPanel>
    );
};
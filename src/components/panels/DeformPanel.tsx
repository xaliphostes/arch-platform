import React, { useState } from 'react';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';

interface DeformPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const DeformPanel: React.FC<DeformPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const [deformScale, setDeformScale] = useState(10);

    return (
        <CollapsibleSubPanel title="Deform" isOpen={isOpen} onToggle={onToggle}>
            <div className="control-group  horizontal">
                <label>Scale: {deformScale}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={deformScale}
                        onChange={(e) => setDeformScale(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={deformScale}
                        onChange={(e) => setDeformScale(Number(e.target.value))}
                        style={{ width: '70px' }}
                    />
                </div>
            </div>
        </CollapsibleSubPanel>
    );
};
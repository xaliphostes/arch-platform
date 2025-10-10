import React from 'react';
import { useScene } from '../../contexts/SceneContext';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';

interface IsoContoursPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const IsoContoursPanel: React.FC<IsoContoursPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        attribute,
        setAttribute,
        displayMode,
        setDisplayMode,
        numContours,
        setNumContours,
        colorTable,
        setColorTable
    } = useScene();

    return (
        <CollapsibleSubPanel title="Iso-Contours" isOpen={isOpen} onToggle={onToggle}>
            <div className="control-group horizontal">
                <label>Attribute</label>
                <select value={attribute} onChange={(e) => setAttribute(e.target.value)}>
                    <option value="filled">z</option>
                </select>
            </div>

            <div className="control-group horizontal">
                <label>Display Mode</label>
                <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as 'filled' | 'lines' | 'both')}
                >
                    <option value="filled">Filled</option>
                    <option value="lines">Lines</option>
                    <option value="both">Both</option>
                </select>
            </div>

            <div className="control-group horizontal">
                <label>Nb: {numContours}</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="3"
                        max="100"
                        value={numContours}
                        onChange={(e) => setNumContours(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min="3"
                        max="100"
                        value={numContours}
                        onChange={(e) => setNumContours(Number(e.target.value))}
                        style={{ width: '60px' }}
                    />
                </div>
            </div>

            <div className="control-group horizontal">
                <label>Color Table</label>
                <select
                    value={colorTable}
                    onChange={(e) => setColorTable(e.target.value)}
                >
                    <option value="Cooltowarm">Cooltowarm</option>
                    <option value="Blackbody">Blackbody</option>
                    <option value="Grayscale">Grayscale</option>
                    <option value="Insar">Insar</option>
                    <option value="InsarBanded">InsarBanded</option>
                    <option value="Rainbow">Rainbow</option>
                    <option value="Igeoss">Igeoss</option>
                    <option value="Stress">Stress</option>
                    <option value="Blue_White_Red">Blue White Red</option>
                    <option value="Blue_Green_Red">Blue Green Red</option>
                    <option value="Spectrum">Spectrum</option>
                    <option value="Default">Default</option>
                </select>
            </div>
        </CollapsibleSubPanel>
    );
};
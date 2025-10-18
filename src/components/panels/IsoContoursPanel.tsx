import React, { useMemo } from 'react';
import { useScene } from '../../contexts/SceneContext';
import { CollapsibleSubPanel } from './CollapsibleSubPanel';
import { PREDEFINED_MODELS } from '../../models/predefinedModels';

interface IsoContoursPanelProps {
    isOpen: boolean;
    onToggle: () => void;
}

type FileEntry = {
    path: string;
    name?: string;
    geologicalType?: string;
    isoContour?: boolean;
};

export const IsoContoursPanel: React.FC<IsoContoursPanelProps> = ({
    isOpen,
    onToggle
}) => {
    const {
        attribute,
        setAttribute,
        availableAttributes,
        displayMode,
        setDisplayMode,
        numContours,
        setNumContours,
        colorTable,
        setColorTable,
        selectedObject,
        loadedModelName,
        // NEW: state + setter to control iso/original per file
        fileVisualizationStates,
        setFileVisualizationState,
    } = useScene();

    // Get all iso-enabled files for the current selection (model / group / file)
    const selectionIsoFiles = useMemo(() => {
        if (!selectedObject || !loadedModelName) return [] as FileEntry[];
        const config = PREDEFINED_MODELS[loadedModelName];
        if (!config) return [];

        // Helper to get all iso-enabled files
        const isoFiles = config.files.filter((f: any) => f.isoContour === true) as FileEntry[];

        // Whole model selected
        if (selectedObject === loadedModelName) return isoFiles;

        const parts = selectedObject.split(':');
        // Specific file selected: "modelName:type:index"
        if (parts.length === 3) {
            const [, type, indexStr] = parts;
            const filesOfType = isoFiles.filter(f => (f.geologicalType || 'Unknown') === type);
            const idx = parseInt(indexStr, 10);
            return filesOfType[idx] ? [filesOfType[idx]] : [];
        }
        // Group/type selected: "modelName:type"
        if (parts.length === 2) {
            const [, type] = parts;
            return isoFiles.filter(f => (f.geologicalType || 'Unknown') === type);
        }
        return [];
    }, [selectedObject, loadedModelName]);

    // Determines if panel should show iso controls at all
    const canShowIsoContours = selectionIsoFiles.length > 0;

    // Compute checkbox states (checked/indeterminate) from per-file vis states
    const allIsoOn = useMemo(() => {
        if (selectionIsoFiles.length === 0) return false;
        return selectionIsoFiles.every(f => fileVisualizationStates.get(f.path) === 'iso');
    }, [selectionIsoFiles, fileVisualizationStates]);

    const allIsoOff = useMemo(() => {
        if (selectionIsoFiles.length === 0) return false;
        return selectionIsoFiles.every(f => fileVisualizationStates.get(f.path) !== 'iso');
    }, [selectionIsoFiles, fileVisualizationStates]);

    const indeterminate = !allIsoOn && !allIsoOff && selectionIsoFiles.length > 0;

    // Ref-callback to set indeterminate safely (no conditional hooks)
    const indeterminateRef = (ind: boolean) =>
        (el: HTMLInputElement | null) => { if (el) el.indeterminate = ind; };

    // Toggle iso state for all files in the current selection
    const toggleIsoForSelection = (enable: boolean) => {
        selectionIsoFiles.forEach(f => {
            setFileVisualizationState(f.path, enable ? 'iso' : 'original');
        });
        // No-op: actual mesh creation/hide/show is handled in ThreeScene effects.
    };

    if (!canShowIsoContours) {
        return (
            <CollapsibleSubPanel title="Iso-Contours" isOpen={isOpen} onToggle={onToggle}>
                <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                    {selectedObject
                        ? 'Selected object does not support iso-contouring'
                        : 'Select an object to configure iso-contours'}
                </div>
            </CollapsibleSubPanel>
        );
    }

    return (
        <CollapsibleSubPanel title="Iso-Contours" isOpen={isOpen} onToggle={onToggle}>

            <div className="control-group horizontal" style={{ marginBottom: 8 }}>
                <label>Enable iso-contours</label>
                <input
                    ref={indeterminateRef(indeterminate)}
                    type="checkbox"
                    checked={allIsoOn}
                    onChange={(e) => toggleIsoForSelection(e.target.checked)}
                />
            </div>

            <div style={{ fontSize: '11px', color: '#4ecdc4', marginBottom: '8px' }}>
                Active for: {selectedObject}
            </div>

            <div className="control-group horizontal">
                <label>Attribute</label>
                <select value={attribute} onChange={(e) => setAttribute(e.target.value)}>
                    {availableAttributes.map(attr => (
                        <option key={attr} value={attr}>{attr}</option>
                    ))}
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

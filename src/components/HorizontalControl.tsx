import React, { ReactNode, CSSProperties } from 'react';

interface HorizontalControlProps {
    label: string;
    children: ReactNode;
    labelWidth?: number | string;
    gap?: number;
    className?: string;
    style?: CSSProperties;
}

/**
 * A reusable component for horizontal label-control layouts
 * @param label - The label text to display
 * @param children - The control element (input, select, etc.)
 * @param labelWidth - Width of the label (default: 'auto')
 * @param gap - Gap between label and control in pixels (default: 10)
 * @param className - Additional CSS class
 * @param style - Additional inline styles
 */
export const HorizontalControl: React.FC<HorizontalControlProps> = ({
    label,
    children,
    labelWidth = 'auto',
    gap = 10,
    className = '',
    style = {}
}) => {
    const containerStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        marginBottom: '12px',
        ...style
    };

    const labelStyle: CSSProperties = {
        fontSize: '12px',
        color: '#ccc',
        whiteSpace: 'nowrap',
        width: labelWidth,
        minWidth: labelWidth === 'auto' ? 'fit-content' : undefined
    };

    const controlStyle: CSSProperties = {
        flex: 1,
        display: 'flex',
        alignItems: 'center'
    };

    return (
        <div className={`horizontal-control ${className}`} style={containerStyle}>
            <label style={labelStyle}>{label}</label>
            <div style={controlStyle}>{children}</div>
        </div>
    );
};

// ============================================================
// Alternative: Grid-based version for better alignment
// ============================================================

interface HorizontalControlGridProps extends HorizontalControlProps {
    columns?: string;
}

/**
 * Grid-based horizontal control for more precise alignment across multiple controls
 */
export const HorizontalControlGrid: React.FC<HorizontalControlGridProps> = ({
    label,
    children,
    labelWidth = '100px',
    gap = 10,
    columns,
    className = '',
    style = {}
}) => {
    const containerStyle: CSSProperties = {
        display: 'grid',
        gridTemplateColumns: columns || `${labelWidth} 1fr`,
        gap: `${gap}px`,
        alignItems: 'center',
        marginBottom: '12px',
        ...style
    };

    const labelStyle: CSSProperties = {
        fontSize: '12px',
        color: '#ccc'
    };

    return (
        <div className={`horizontal-control-grid ${className}`} style={containerStyle}>
            <label style={labelStyle}>{label}</label>
            <div>{children}</div>
        </div>
    );
};

// ============================================================
// Example Usage in IsoContoursPanel
// ============================================================

/*
import { HorizontalControl } from './HorizontalControl';

// Basic usage
<HorizontalControl label="Attribute">
    <select value={attribute} onChange={(e) => setAttribute(e.target.value)}>
        <option value="filled">z</option>
    </select>
</HorizontalControl>

// With fixed label width for alignment
<HorizontalControl label="Display Mode" labelWidth={80}>
    <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)}>
        <option value="filled">Filled</option>
        <option value="lines">Lines</option>
    </select>
</HorizontalControl>

// With custom gap
<HorizontalControl label="Color Table" labelWidth={80} gap={15}>
    <select value={colorTable} onChange={(e) => setColorTable(e.target.value)}>
        <option value="Rainbow">Rainbow</option>
    </select>
</HorizontalControl>

// Grid-based for better alignment across multiple controls
<HorizontalControlGrid label="Attribute" labelWidth="100px">
    <select value={attribute} onChange={(e) => setAttribute(e.target.value)}>
        <option value="filled">z</option>
    </select>
</HorizontalControlGrid>

<HorizontalControlGrid label="Display Mode" labelWidth="100px">
    <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)}>
        <option value="filled">Filled</option>
    </select>
</HorizontalControlGrid>
*/
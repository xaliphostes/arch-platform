import React, { ReactNode } from 'react';
import './collapsibleSubPanel.css';

export interface CollapsibleSubPanelProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
}

export const CollapsibleSubPanel: React.FC<CollapsibleSubPanelProps> = ({
    title,
    isOpen,
    onToggle,
    children
}) => {
    return (
        <div className={`collapsible-panel ${isOpen ? 'expanded' : ''}`}>
            <div className="collapsible-header" onClick={onToggle}>
                <h3 className="collapsible-title">{title}</h3>
                <span className={`collapsible-icon ${isOpen ? 'open' : ''}`}>
                    ▼
                </span>
            </div>
            <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                <div className="collapsible-body">
                    {children}
                </div>
            </div>
        </div>
    );
};
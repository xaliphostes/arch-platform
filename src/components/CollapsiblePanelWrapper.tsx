import React, { useState, useEffect } from 'react'
import './CollapsiblePanelWrapper.css'

interface CollapsiblePanelWrapperProps {
    children: React.ReactNode
    side: 'left' | 'right'
    defaultWidth?: number
    onToggle?: (isCollapsed: boolean) => void
}

export const CollapsiblePanelWrapper: React.FC<CollapsiblePanelWrapperProps> = ({
    children,
    side,
    defaultWidth = 250,
    onToggle
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const handleToggle = () => {
        const newCollapsed = !isCollapsed
        setIsCollapsed(newCollapsed)
        if (onToggle) {
            onToggle(newCollapsed)
        }
        
        // Trigger a window resize event after animation completes
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'))
        }, 300) // Match the CSS transition duration
    }

    return (
        <div 
            className={`collapsible-panel-wrapper ${side} ${isCollapsed ? 'collapsed' : ''}`}
            style={{ width: isCollapsed ? '40px' : `${defaultWidth}px` }}
        >
            <button
                className={`collapse-toggle ${side}`}
                onClick={handleToggle}
                title={isCollapsed ? `Expand ${side} panel` : `Collapse ${side} panel`}
            >
                {/* {side === 'left' ? (
                    isCollapsed ? '▶' : '◀'
                ) : (
                    isCollapsed ? '◀' : '▶'
                )} */}
            </button>
            <div className={`panel-content ${isCollapsed ? 'hidden' : ''}`}>
                {children}
            </div>
        </div>
    )
}
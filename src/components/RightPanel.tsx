import React from 'react'

export const RightPanel = () => {
    return (
        <div className="right-panel">
            <div className="panel-section">
                <h3>Properties</h3>
                <p style={{ fontSize: '12px', color: '#666' }}>
                    Select an object to edit its properties
                </p>
            </div>

            <div className="panel-section">
                <h3>Transform</h3>
                <div className="control-group">
                    <label>Position X</label>
                    <input type="number" defaultValue="0" step="0.1" />
                </div>
                <div className="control-group">
                    <label>Position Y</label>
                    <input type="number" defaultValue="0" step="0.1" />
                </div>
                <div className="control-group">
                    <label>Position Z</label>
                    <input type="number" defaultValue="0" step="0.1" />
                </div>
            </div>

            <div className="panel-section">
                <h3>Rotation</h3>
                <div className="control-group">
                    <label>Rotation X</label>
                    <input type="number" defaultValue="0" step="0.1" />
                </div>
                <div className="control-group">
                    <label>Rotation Y</label>
                    <input type="number" defaultValue="0" step="0.1" />
                </div>
                <div className="control-group">
                    <label>Rotation Z</label>
                    <input type="number" defaultValue="0" step="0.1" />
                </div>
            </div>

            <div className="panel-section">
                <h3>Material</h3>
                <div className="control-group">
                    <label>Color</label>
                    <input type="color" defaultValue="#00ff00" />
                </div>
                <div className="control-group">
                    <label>Opacity</label>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="1" />
                </div>
            </div>
        </div>
    )
}
import React from 'react'

export const LeftPanel = () => {
    return (
        <div className="left-panel">
            <div className="panel-section">
                <h3>Scene Hierarchy</h3>
                <div className="scene-object">Scene</div>
                <div className="scene-object" style={{ marginLeft: '16px' }}>
                    📦 Cube
                </div>
                <div className="scene-object" style={{ marginLeft: '16px' }}>
                    💡 Ambient Light
                </div>
                <div className="scene-object" style={{ marginLeft: '16px' }}>
                    💡 Directional Light
                </div>
            </div>

            <div className="panel-section">
                <h3>Add Objects</h3>
                <div className="control-group">
                    <button>+ Add Cube</button>
                </div>
                <div className="control-group">
                    <button>+ Add Sphere</button>
                </div>
                <div className="control-group">
                    <button>+ Add Plane</button>
                </div>
                <div className="control-group">
                    <button>+ Add Light</button>
                </div>
            </div>
        </div>
    )
}
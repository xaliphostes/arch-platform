import React, { useState } from 'react'
import { useScene } from '../contexts/SceneContext'

export const LeftPanel = () => {
    const { selectedModel, setSelectedModel } = useScene()

    const handleModelChange = (model: string) => {
        setSelectedModel(model)
    }

    return (
        <div className="left-panel">
            <div className="panel-section">
                <h3>Models</h3>

                <div className="control-group">
                    <label>Predefined models</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                    >
                        <option value="NashPoint">Nash Point</option>
                        <option value="Galapagos">Galapagos</option>
                    </select>
                </div>

                <button
                    onClick={() => setSelectedModel(selectedModel)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        marginTop: '8px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Load Model
                </button>
            </div>

            <div className="panel-section">
                <h3>Scene Hierarchy</h3>
                <div className="scene-object">Scene</div>
                {/* Model hierarchy will be added here */}
            </div>
        </div>
    )
}
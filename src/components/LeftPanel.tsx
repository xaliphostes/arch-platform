import React, { useState } from 'react'

export const LeftPanel = () => {
    const [selectedModel, setSelectedModel] = useState('NashPoint')

    return (
        <div className="left-panel">

            <div className="panel-section">
                <div className="control-group">
                    <button>Load ARCH project</button>
                </div>
                <div className="control-group">
                    <label>Predefined models</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        <option value="Simple">Simple</option>
                        <option value="EnEchelon">En Echelon</option>
                        <option value="NashPoint">Nash Point</option>
                        <option value="HectorMine">Hector Mine</option>
                        <option value="Galapagos">Galapagos</option>
                    </select>
                </div>
            </div>

            <div className="panel-section">
                <h3>Scene Hierarchy</h3>
                <div className="scene-object">Scene</div>
                <div className="scene-object" style={{ marginLeft: '16px' }}>
                    📦 Analytic surface
                </div>
                {/* <div className="scene-object" style={{ marginLeft: '16px' }}>
                    💡 Ambient Light
                </div>
                <div className="scene-object" style={{ marginLeft: '16px' }}>
                    💡 Directional Light
                </div> */}
            </div>

        </div>
    )
}
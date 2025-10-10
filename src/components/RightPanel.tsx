import React, { useState } from 'react'
import { useScene } from '../contexts/SceneContext'
import './collapsiblePanel.css'

export const RightPanel = () => {
    const {
        displayMode,
        setDisplayMode,
        numContours,
        setNumContours,
        colorTable,
        setColorTable,
        stressR,
        setStressR,
        stressTheta,
        setStressTheta,
        stressPressure,
        setStressPressure
    } = useScene()

    // State for collapsible panels
    const [isContoursOpen, setIsContoursOpen] = useState(true)
    const [isStressOpen, setIsStressOpen] = useState(true)
    const [isPressureOpen, setIsPressureOpen] = useState(true)

    return (
        <div className="right-panel">

            {/* Iso-Contours Collapsible Panel */}
            <div className={`collapsible-panel ${isContoursOpen ? 'expanded' : ''}`}>
                <div
                    className="collapsible-header"
                    onClick={() => setIsContoursOpen(!isContoursOpen)}
                >
                    <h3 className="collapsible-title">Iso-Contours</h3>
                    <span className={`collapsible-icon ${isContoursOpen ? 'open' : ''}`}>
                        ▼
                    </span>
                </div>
                <div className={`collapsible-content ${isContoursOpen ? 'open' : ''}`}>
                    <div className="collapsible-body">

                        {/* Display Mode */}
                        <div className="control-group">
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

                        {/* Number of Contours */}
                        <div className="control-group">
                            <label>Number of Contours: {numContours}</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min="3"
                                    max="30"
                                    value={numContours}
                                    onChange={(e) => setNumContours(Number(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min="3"
                                    max="30"
                                    value={numContours}
                                    onChange={(e) => setNumContours(Number(e.target.value))}
                                    style={{ width: '60px' }}
                                />
                            </div>
                        </div>

                        {/* Color Table */}
                        <div className="control-group">
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

                    </div>
                </div>
            </div>

            {/* Tectonic Stress Collapsible Panel */}
            <div className={`collapsible-panel ${isStressOpen ? 'expanded' : ''}`}>
                <div
                    className="collapsible-header"
                    onClick={() => setIsStressOpen(!isStressOpen)}
                >
                    <h3 className="collapsible-title">Tectonic Stress</h3>
                    <span className={`collapsible-icon ${isStressOpen ? 'open' : ''}`}>
                        ▼
                    </span>
                </div>
                <div className={`collapsible-content ${isStressOpen ? 'open' : ''}`}>
                    <div className="collapsible-body">

                        {/* R parameter */}
                        <div className="control-group">
                            <label>R: {stressR.toFixed(2)}</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max="3"
                                    step="0.1"
                                    value={stressR}
                                    onChange={(e) => setStressR(Number(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    step="0.1"
                                    value={stressR}
                                    onChange={(e) => setStressR(Number(e.target.value))}
                                    style={{ width: '70px' }}
                                />
                            </div>
                        </div>

                        {/* Theta parameter */}
                        <div className="control-group">
                            <label>θ: {stressTheta.toFixed(0)}°</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max="180"
                                    step="1"
                                    value={stressTheta}
                                    onChange={(e) => setStressTheta(Number(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="180"
                                    step="1"
                                    value={stressTheta}
                                    onChange={(e) => setStressTheta(Number(e.target.value))}
                                    style={{ width: '70px' }}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Pressure Collapsible Panel */}
            <div className={`collapsible-panel ${isPressureOpen ? 'expanded' : ''}`}>
                <div
                    className="collapsible-header"
                    onClick={() => setIsPressureOpen(!isPressureOpen)}
                >
                    <h3 className="collapsible-title">Pressure</h3>
                    <span className={`collapsible-icon ${isPressureOpen ? 'open' : ''}`}>
                        ▼
                    </span>
                </div>
                <div className={`collapsible-content ${isPressureOpen ? 'open' : ''}`}>
                    <div className="collapsible-body">

                        <div className="control-group">
                            <label>Pressure: {stressPressure.toFixed(0)}</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={stressPressure}
                                    onChange={(e) => setStressPressure(Number(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={stressPressure}
                                    onChange={(e) => setStressPressure(Number(e.target.value))}
                                    style={{ width: '70px' }}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    )
}
import React from 'react'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { CollapsiblePanelWrapper } from './components/CollapsiblePanelWrapper'
import { ThreeScene } from './components/ThreeScene'
import { SceneProvider } from './contexts/SceneContext'
import './App.css'

function App() {
    return (
        <SceneProvider>
            <div className="app-container">
                <CollapsiblePanelWrapper side="left" defaultWidth={250}>
                    <LeftPanel />
                </CollapsiblePanelWrapper>

                <ThreeScene />

                <CollapsiblePanelWrapper side="right" defaultWidth={300}>
                    <RightPanel />
                </CollapsiblePanelWrapper>
            </div>
        </SceneProvider>
    )
}

export default App
import React from 'react'
import { ThreeScene } from './components/ThreeScene'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { SceneProvider } from './contexts/SceneContext'
import './App.css'

function App() {
    return (
        <SceneProvider>
            <div className="app-container">
                <LeftPanel />
                <ThreeScene />
                <RightPanel />
            </div>
        </SceneProvider>
    )
}

export default App

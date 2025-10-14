import React, { useMemo } from 'react'
import { useScene } from '../contexts/SceneContext'
import { PREDEFINED_MODELS } from '../utils/ModelLoader'

export const LeftPanel = () => {
    const { selectedModel, setSelectedModel, loadedModelName } = useScene()

    // Organize files by geological type
    const organizedFiles = useMemo(() => {
        if (!loadedModelName) return null

        const config = PREDEFINED_MODELS[loadedModelName]
        if (!config) return null

        // Group files by geological type
        const groups: { [key: string]: typeof config.files } = {}
        
        config.files.forEach(file => {
            const type = file.geologicalType || 'Unknown'
            if (!groups[type]) {
                groups[type] = []
            }
            groups[type].push(file)
        })

        return groups
    }, [loadedModelName])

    // Get icon for geological type
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Discontinuity':
                return '🔴'
            case 'Grid':
                return '🟦'
            case 'Unknown':
                return '⚪'
            default:
                return '📦'
        }
    }

    // Get color for geological type
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Discontinuity':
                return '#ff6b6b'
            case 'Grid':
                return '#4ecdc4'
            case 'Unknown':
                return '#999999'
            default:
                return '#888888'
        }
    }

    return (
        <div className="left-panel">

            <div className="panel-section">
                <div className="control-group">
                    <button>Load ARCH project</button>
                </div>
                <div className="control-group">
                    <label>Predefined models</label>
                    <select
                        value={selectedModel || ''}
                        onChange={(e) => setSelectedModel(e.target.value || null)}
                    >
                        <option value="Galapagos">Galapagos</option>
                        <option value="NashPoint">Nash Point</option>
                    </select>
                </div>
            </div>

            <div className="panel-section">
                <h3>Scene Hierarchy</h3>
                
                {/* Root scene node */}
                {/* <div className="scene-object">
                    🌍 Scene
                </div> */}

                {/* Model node */}
                {loadedModelName && (
                    <div className="scene-object" style={{ marginLeft: '16px' }}>
                        📦 {loadedModelName}
                    </div>
                )}

                {/* Organized files by geological type */}
                {organizedFiles && Object.entries(organizedFiles).map(([type, files]) => (
                    <div key={type}>
                        {/* Geological type group */}
                        <div 
                            className="scene-object" 
                            style={{ 
                                marginLeft: '32px',
                                borderLeft: `3px solid ${getTypeColor(type)}`
                            }}
                        >
                            {getTypeIcon(type)} {type}
                        </div>

                        {/* Files in this type */}
                        {files.map((file, index) => (
                            <div 
                                key={index}
                                className="scene-object" 
                                style={{ 
                                    marginLeft: '48px',
                                    fontSize: '11px',
                                    padding: '6px 8px'
                                }}
                            >
                                {file.visible !== false ? '👁️' : '🚫'} {file.name || file.path}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

        </div>
    )
}



// import React from 'react'
// import { useScene } from '../contexts/SceneContext'

// export const LeftPanel = () => {
//     const { selectedModel, setSelectedModel } = useScene()

//     return (
//         <div className="left-panel">

//             <div className="panel-section">
//                 <div className="control-group">
//                     <button>Load ARCH project</button>
//                 </div>
//                 <div className="control-group">
//                     <label>Predefined models</label>
//                     <select
//                         value={selectedModel || ''}
//                         onChange={(e) => setSelectedModel(e.target.value || null)}
//                     >
//                         <option value="">-- Select a model --</option>
//                         <option value="Galapagos">Galapagos</option>
//                         <option value="NashPoint">Nash Point</option>
//                     </select>
//                 </div>
//             </div>

//             <div className="panel-section">
//                 <h3>Scene Hierarchy</h3>
//                 <div className="scene-object">Scene</div>
//                 <div className="scene-object" style={{ marginLeft: '16px' }}>
//                     📦 Analytic surface
//                 </div>
//             </div>

//         </div>
//     )
// }
import React, { useMemo } from 'react'
import { useScene } from '../contexts/SceneContext'
import { PREDEFINED_MODELS } from '../utils/ModelLoader'

type FileEntry = {
  path: string
  name?: string
  geologicalType?: string
  visible?: boolean
}

type ModelConfig = {
  name?: string
  files: FileEntry[]
}

const getTypeKey = (f: FileEntry) => f.geologicalType || 'Unknown'

// Optional icon/color helpers
const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'fault': return '🪨'
    case 'horizon': return '📈'
    case 'layer': return '📚'
    default: return '🗂️'
  }
}

const getTypeColor = (type: string) => {
  const map: Record<string, string> = {
    fault: '#c0392b',
    horizon: '#2980b9',
    layer: '#27ae60',
    unknown: '#7f8c8d'
  }
  return map[type.toLowerCase()] || map.unknown
}

export const LeftPanel: React.FC = () => {
  const {
    selectedModel, setSelectedModel,
    loadedModelName,
    selectedObject, setSelectedObject,
    visibilityStates, setFileVisibility,
  } = useScene()

  // Group files by geological type
  const organized = useMemo(() => {
    if (!loadedModelName) return {} as Record<string, FileEntry[]>
    const cfg: ModelConfig | undefined = PREDEFINED_MODELS[loadedModelName]
    const groups: Record<string, FileEntry[]> = {}
    cfg?.files?.forEach((f) => {
      const k = getTypeKey(f)
      if (!groups[k]) groups[k] = []
      groups[k].push(f)
    })
    return groups
  }, [loadedModelName])

  const fileIsVisible = (file: FileEntry) => {
    const explicit = visibilityStates.get(file.path)
    return explicit !== undefined ? explicit : (file.visible !== false)
  }

  // Toggle all model files
  const toggleModel = (visible: boolean) => {
    if (!loadedModelName) return
    const cfg: ModelConfig | undefined = PREDEFINED_MODELS[loadedModelName]
    cfg?.files?.forEach((f) => setFileVisibility(f.path, visible))
  }

  // Toggle group of files
  const toggleGroup = (type: string, visible: boolean) => {
    if (!loadedModelName) return
    const cfg: ModelConfig | undefined = PREDEFINED_MODELS[loadedModelName]
    cfg?.files
      ?.filter((f) => getTypeKey(f) === type)
      .forEach((f) => setFileVisibility(f.path, visible))
  }

  // Ref-callback to set indeterminate state (safe: no conditional hooks)
  const indeterminateRef = (indeterminate: boolean) =>
    (el: HTMLInputElement | null) => {
      if (el) el.indeterminate = indeterminate
    }

  const renderModelRow = () => {
    if (!loadedModelName) return null
    const cfg: ModelConfig | undefined = PREDEFINED_MODELS[loadedModelName]
    const files = cfg?.files ?? []
    const allOn = files.length > 0 && files.every(fileIsVisible)
    const allOff = files.length > 0 && files.every((f) => !fileIsVisible(f))
    const indeterminate = !allOn && !allOff

    return (
      <div
        className={`scene-object clickable ${selectedObject === loadedModelName ? 'selected' : ''}`}
        style={{ marginLeft: '16px' }}
        onClick={() => setSelectedObject(loadedModelName)}
      >
        <span>📦 {loadedModelName}</span>
        <input
          ref={indeterminateRef(indeterminate)}
          type="checkbox"
          checked={allOn}
          onChange={(e) => {
            e.stopPropagation()
            toggleModel(e.target.checked)
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  const renderGroupBlock = (type: string, files: FileEntry[]) => {
    const allOn = files.every(fileIsVisible)
    const allOff = files.every((f) => !fileIsVisible(f))
    const indeterminate = !allOn && !allOff
    const groupId = `${loadedModelName}:${type}`

    return (
      <div key={type}>
        <div
          className={`scene-object clickable ${selectedObject === groupId ? 'selected' : ''}`}
          style={{ marginLeft: '32px', borderLeft: `3px solid ${getTypeColor(type)}` }}
          onClick={(e) => { e.stopPropagation(); setSelectedObject(groupId) }}
        >
          <span>{getTypeIcon(type)} {type}</span>
          <input
            ref={indeterminateRef(indeterminate)}
            type="checkbox"
            checked={allOn}
            onChange={(e) => {
              e.stopPropagation()
              toggleGroup(type, e.target.checked)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {files.map((file, index) => {
          const fileId = `${loadedModelName}:${type}:${index}`
          const visible = fileIsVisible(file)
          return (
            <div
              key={file.path || index}
              className={`scene-object clickable ${selectedObject === fileId ? 'selected' : ''}`}
              style={{ marginLeft: '48px', fontSize: '11px', padding: '6px 8px' }}
              onClick={(e) => { e.stopPropagation(); setSelectedObject(fileId) }}
            >
              <span>{visible ? '👁️' : '🚫'} {file.name || file.path}</span>
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => {
                  e.stopPropagation()
                  setFileVisibility(file.path, e.target.checked)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="left-panel">

      {/* === TOP CONTROLS === */}
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
            {Object.keys(PREDEFINED_MODELS).map((modelKey) => (
              <option key={modelKey} value={modelKey}>
                {PREDEFINED_MODELS[modelKey].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* === SCENE HIERARCHY === */}
      <div className="panel-section">
        <h3>Scene Hierarchy</h3>
        {renderModelRow()}
        {Object.entries(organized).map(([type, files]) => renderGroupBlock(type, files))}
      </div>
    </div>
  )
}






// import React, { useMemo } from 'react'
// import { useScene } from '../contexts/SceneContext'
// import { PREDEFINED_MODELS } from '../utils/ModelLoader'

// export const LeftPanel = () => {
//     const { selectedModel, setSelectedModel, loadedModelName, selectedObject, setSelectedObject } = useScene()

//     // Organize files by geological type
//     const organizedFiles = useMemo(() => {
//         if (!loadedModelName) return null

//         const config = PREDEFINED_MODELS[loadedModelName]
//         if (!config) return null

//         const groups: { [key: string]: typeof config.files } = {}
        
//         config.files.forEach(file => {
//             const type = file.geologicalType || 'Unknown'
//             if (!groups[type]) {
//                 groups[type] = []
//             }
//             groups[type].push(file)
//         })

//         return groups
//     }, [loadedModelName])

//     const getTypeIcon = (type: string) => {
//         switch (type) {
//             case 'Discontinuity':
//                 return '🔴'
//             case 'Grid':
//                 return '🟦'
//             case 'Unknown':
//                 return '⚪'
//             default:
//                 return '📦'
//         }
//     }

//     const getTypeColor = (type: string) => {
//         switch (type) {
//             case 'Discontinuity':
//                 return '#ff6b6b'
//             case 'Grid':
//                 return '#4ecdc4'
//             case 'Unknown':
//                 return '#999999'
//             default:
//                 return '#888888'
//         }
//     }

//     // Helper to check if an object is selected
//     const isSelected = (objectId: string) => selectedObject === objectId

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
//                         {Object.keys(PREDEFINED_MODELS).map((modelKey) => (
//                             <option key={modelKey} value={modelKey}>
//                                 {PREDEFINED_MODELS[modelKey].name}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//             </div>

//             <div className="panel-section">
//                 <h3>Scene Hierarchy</h3>

//                 {/* Model node - clickable */}
//                 {loadedModelName && (
//                     <div 
//                         className={`scene-object clickable ${isSelected(loadedModelName) ? 'selected' : ''}`}
//                         style={{ marginLeft: '16px' }}
//                         onClick={() => setSelectedObject(loadedModelName)}
//                     >
//                         📦 {loadedModelName}
//                     </div>
//                 )}

//                 {/* Organized files by geological type */}
//                 {organizedFiles && Object.entries(organizedFiles).map(([type, files]) => (
//                     <div key={type}>
//                         {/* Geological type group - clickable */}
//                         <div 
//                             className={`scene-object clickable ${isSelected(`${loadedModelName}:${type}`) ? 'selected' : ''}`}
//                             style={{ 
//                                 marginLeft: '32px',
//                                 borderLeft: `3px solid ${getTypeColor(type)}`
//                             }}
//                             onClick={(e) => {
//                                 e.stopPropagation()
//                                 setSelectedObject(`${loadedModelName}:${type}`)
//                             }}
//                         >
//                             {getTypeIcon(type)} {type}
//                         </div>

//                         {/* Files in this type - clickable */}
//                         {files.map((file, index) => {
//                             const fileId = `${loadedModelName}:${type}:${index}`
//                             return (
//                                 <div 
//                                     key={index}
//                                     className={`scene-object clickable ${isSelected(fileId) ? 'selected' : ''}`}
//                                     style={{ 
//                                         marginLeft: '48px',
//                                         fontSize: '11px',
//                                         padding: '6px 8px'
//                                     }}
//                                     onClick={(e) => {
//                                         e.stopPropagation()
//                                         setSelectedObject(fileId)
//                                     }}
//                                 >
//                                     {file.visible !== false ? '👁️' : '🚫'} {file.name || file.path}
//                                 </div>
//                             )
//                         })}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     )
// }
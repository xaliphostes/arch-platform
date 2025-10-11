import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ModelConfig } from '../utils/ModelLoader'

type DisplayMode = 'filled' | 'lines' | 'both'

interface SceneContextType {
    selectedObject: string | null
    setSelectedObject: (id: string | null) => void
    objects: any[]
    addObject: (object: any) => void

    // Iso-contours parameters
    attribute: string
    setAttribute: (attr: string) => void
    displayMode: DisplayMode
    setDisplayMode: (mode: DisplayMode) => void
    numContours: number
    setNumContours: (num: number) => void
    colorTable: string
    setColorTable: (table: string) => void

    // Tectonic stress parameters
    stressR: number
    setStressR: (r: number) => void
    stressTheta: number
    setStressTheta: (theta: number) => void
    stressPressure: number
    setStressPressure: (pressure: number) => void

    // Model loading
    selectedModel: string
    setSelectedModel: (model: string) => void
    loadedModelName: string | null
    setLoadedModelName: (name: string | null) => void
}

const SceneContext = createContext<SceneContextType | undefined>(undefined)

export const SceneProvider = ({ children }: { children: ReactNode }) => {
    const [selectedObject, setSelectedObject] = useState<string | null>(null)
    const [objects, setObjects] = useState<any[]>([])

    // Iso-contours state
    const [attribute, setAttribute] = useState('z')
    const [displayMode, setDisplayMode] = useState<DisplayMode>('filled')
    const [numContours, setNumContours] = useState(10)
    const [colorTable, setColorTable] = useState('Rainbow')

    // Tectonic stress state
    const [stressR, setStressR] = useState(0)
    const [stressTheta, setStressTheta] = useState(90)
    const [stressPressure, setStressPressure] = useState(50)

    const addObject = (object: any) => {
        setObjects([...objects, object])
    }

    // Add model state
    const [selectedModel, setSelectedModel] = useState('NashPoint')
    const [loadedModelName, setLoadedModelName] = useState<string | null>(null)


    return (
        <SceneContext.Provider value={{
            selectedObject,
            setSelectedObject,
            objects,
            addObject,
            attribute,
            setAttribute,
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
            setStressPressure,

            selectedModel,
            setSelectedModel,
            loadedModelName,
            setLoadedModelName
        }}>
            {children}
        </SceneContext.Provider>
    )
}

export const useScene = () => {
    const context = useContext(SceneContext)
    if (!context) throw new Error('useScene must be used within SceneProvider')
    return context
}

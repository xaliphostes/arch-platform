import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SceneContextType {
    selectedObject: string | null
    setSelectedObject: (id: string | null) => void
    objects: any[]
    addObject: (object: any) => void
}

const SceneContext = createContext<SceneContextType | undefined>(undefined)

export const SceneProvider = ({ children }: { children: ReactNode }) => {
    const [selectedObject, setSelectedObject] = useState<string | null>(null)
    const [objects, setObjects] = useState<any[]>([])

    const addObject = (object: any) => {
        setObjects([...objects, object])
    }

    return (
        <SceneContext.Provider value={{ selectedObject, setSelectedObject, objects, addObject }}>
            {children}
        </SceneContext.Provider>
    )
}

export const useScene = () => {
    const context = useContext(SceneContext)
    if (!context) throw new Error('useScene must be used within SceneProvider')
    return context
}
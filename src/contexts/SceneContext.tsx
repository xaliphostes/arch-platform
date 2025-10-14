import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SceneContextType {
    attribute: string;
    setAttribute: (value: string) => void;
    availableAttributes: string[];
    setAvailableAttributes: (attributes: string[]) => void;
    displayMode: 'filled' | 'lines' | 'both';
    setDisplayMode: (mode: 'filled' | 'lines' | 'both') => void;
    numContours: number;
    setNumContours: (num: number) => void;
    colorTable: string;
    setColorTable: (table: string) => void;
    selectedModel: string | null;
    setSelectedModel: (model: string | null) => void;
    loadedModelName: string | null;
    setLoadedModelName: (name: string | null) => void;
    // Tectonic stress parameters
    stressR: number;
    setStressR: (value: number) => void;
    stressTheta: number;
    setStressTheta: (value: number) => void;
    stressPressure: number;
    setStressPressure: (value: number) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [attribute, setAttribute] = useState<string>('z');
    const [availableAttributes, setAvailableAttributes] = useState<string[]>(['z']);
    const [displayMode, setDisplayMode] = useState<'filled' | 'lines' | 'both'>('filled');
    const [numContours, setNumContours] = useState<number>(20);
    const [colorTable, setColorTable] = useState<string>('Rainbow');
    const [selectedModel, setSelectedModel] = useState<string | null>('Galapagos'); // Changed from null to empty string
    const [loadedModelName, setLoadedModelName] = useState<string | null>(''); // Changed from null to empty string
    
    // Tectonic stress parameters
    const [stressR, setStressR] = useState<number>(1.5);
    const [stressTheta, setStressTheta] = useState<number>(90);
    const [stressPressure, setStressPressure] = useState<number>(50);

    return (
        <SceneContext.Provider
            value={{
                attribute,
                setAttribute,
                availableAttributes,
                setAvailableAttributes,
                displayMode,
                setDisplayMode,
                numContours,
                setNumContours,
                colorTable,
                setColorTable,
                selectedModel,
                setSelectedModel,
                loadedModelName,
                setLoadedModelName,
                stressR,
                setStressR,
                stressTheta,
                setStressTheta,
                stressPressure,
                setStressPressure
            }}
        >
            {children}
        </SceneContext.Provider>
    );
};

export const useScene = () => {
    const context = useContext(SceneContext);
    if (context === undefined) {
        throw new Error('useScene must be used within a SceneProvider');
    }
    return context;
};

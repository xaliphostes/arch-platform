import React, { useState, useEffect } from 'react'
import * as THREE from 'three'
import * as io from '@youwol/io'

// Import @youwol/io decoders (you'll need to install this package)
// import * as io from '@youwol/io';

// Model configuration interface
interface ModelFile {
    path: string;
    type: 'TS' | 'PL' | 'SO' | 'VS'; // GOCAD file types
    name?: string;
}

interface ModelConfig {
    name: string;
    files: ModelFile[];
}

// Type definitions for decoded GOCAD data
interface DecodedGOCAD {
    positions?: Float32Array;
    indices?: Uint32Array;
    segments?: Uint32Array; // For PL files
    count: number;
    attributes?: { [key: string]: Float32Array };
}

// Generic model pre-loader
class ModelPreLoader {
    private cache: Map<string, DecodedGOCAD> = new Map();

    async fetchAndDecode(file: ModelFile): Promise<DecodedGOCAD> {
        const cacheKey = file.path;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const response = await fetch(file.path);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${file.path}: ${response.statusText}`);
            }

            const text = await response.text();

            // Use @youwol/io decoders based on file type
            let decoded: DecodedGOCAD;

            // TODO: Replace with actual @youwol/io decoder calls
            // Example:
            // switch (file.type) {
            //   case 'TS':
            //     decoded = io.decoders.TS(text);
            //     break;
            //   case 'PL':
            //     decoded = io.decoders.PL(text);
            //     break;
            //   case 'SO':
            //     decoded = io.decoders.SO(text);
            //     break;
            //   case 'VS':
            //     decoded = io.decoders.VS(text);
            //     break;
            // }

            // Temporary fallback (simple parsing for demo)
            decoded = this.simpleParse(text, file.type);

            this.cache.set(cacheKey, decoded);
            return decoded;

        } catch (error) {
            console.error(`Error loading ${file.path}:`, error);
            throw error;
        }
    }

    // Simple parser for demo purposes - replace with @youwol/io
    private simpleParse(text: string, type: string): DecodedGOCAD {
        const lines = text.split('\n');
        const vertices: number[] = [];
        const indices: number[] = [];
        const segments: number[] = [];
        const vertexMap = new Map<number, number>();
        let currentIndex = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('VRTX ') || trimmed.startsWith('PVRTX ')) {
                const parts = trimmed.split(/\s+/);
                const id = parseInt(parts[1]);
                const x = parseFloat(parts[2]);
                const y = parseFloat(parts[3]);
                const z = parseFloat(parts[4]);

                vertices.push(x, y, z);
                vertexMap.set(id, currentIndex++);
            }

            else if (trimmed.startsWith('TRGL ') && type === 'TS') {
                const parts = trimmed.split(/\s+/);
                const v1 = vertexMap.get(parseInt(parts[1]));
                const v2 = vertexMap.get(parseInt(parts[2]));
                const v3 = vertexMap.get(parseInt(parts[3]));

                if (v1 !== undefined && v2 !== undefined && v3 !== undefined) {
                    indices.push(v1, v2, v3);
                }
            }

            else if (trimmed.startsWith('SEG ') && type === 'PL') {
                const parts = trimmed.split(/\s+/);
                const v1 = vertexMap.get(parseInt(parts[1]));
                const v2 = vertexMap.get(parseInt(parts[2]));

                if (v1 !== undefined && v2 !== undefined) {
                    segments.push(v1, v2);
                }
            }
        }

        return {
            positions: new Float32Array(vertices),
            indices: type === 'TS' ? new Uint32Array(indices) : undefined,
            segments: type === 'PL' ? new Uint32Array(segments) : undefined,
            count: vertices.length / 3
        };
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}

// Predefined model configurations
const PREDEFINED_MODELS: { [key: string]: ModelConfig } = {
    'Galapagos': {
        name: 'Galapagos',
        files: [
            { path: '/models/Galapagos/fault_1.ts', type: 'TS', name: 'Fault 1' },
            { path: '/models/Galapagos/fault_2.ts', type: 'TS', name: 'Fault 2' },
            { path: '/models/Galapagos/grid.ts', type: 'TS', name: 'Grid' },
            { path: '/models/Galapagos/topography.ts', type: 'TS', name: 'Topography' }
        ]
    },
    'NashPoint': {
        name: 'Nash Point',
        files: [
            { path: '/models/NashPoint/2D_grid.ts', type: 'TS', name: '2D Grid' },
            { path: '/models/NashPoint/NashPoint_faults.ts', type: 'TS', name: 'Faults' },
            { path: '/models/NashPoint/all_joints_3D.ts', type: 'TS', name: 'Joints 3D' },
            { path: '/models/NashPoint/all_joints.pl', type: 'PL', name: 'Joints Lines' }
        ]
    },
    'Simple': {
        name: 'Simple',
        files: [
            { path: '/models/fault.ts', type: 'TS', name: 'Fault' },
            { path: '/models/grid.ts', type: 'TS', name: 'Grid' }
        ]
    }
};

// Main component
const GenericModelPreLoader: React.FC = () => {
    const [status, setStatus] = useState<string>('Ready');
    const [loadedFiles, setLoadedFiles] = useState<{ file: string; status: string; info?: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('Galapagos');
    const [preLoader] = useState(() => new ModelPreLoader());

    const loadModel = async (modelName: string) => {
        const modelConfig = PREDEFINED_MODELS[modelName];
        if (!modelConfig) {
            setStatus(`Model ${modelName} not found`);
            return;
        }

        setLoading(true);
        setStatus(`Loading ${modelConfig.name}...`);
        setLoadedFiles([]);

        const loaded: { file: string; status: string; info?: string }[] = [];

        for (const file of modelConfig.files) {
            try {
                setStatus(`Loading ${file.name || file.path}...`);

                const data = await preLoader.fetchAndDecode(file);

                let info = `${data.count} vertices`;
                if (data.indices) {
                    info += `, ${data.indices.length / 3} triangles`;
                }
                if (data.segments) {
                    info += `, ${data.segments.length / 2} segments`;
                }

                loaded.push({
                    file: file.name || file.path,
                    status: '✓ Loaded',
                    info
                });

                setLoadedFiles([...loaded]);
            } catch (error) {
                loaded.push({
                    file: file.name || file.path,
                    status: '✗ Failed',
                    info: error instanceof Error ? error.message : 'Unknown error'
                });
                setLoadedFiles([...loaded]);
            }
        }

        setStatus(`Completed! Loaded ${loaded.filter(f => f.status.includes('✓')).length}/${modelConfig.files.length} files`);
        setLoading(false);
    };

    const clearCache = () => {
        preLoader.clearCache();
        setLoadedFiles([]);
        setStatus('Cache cleared');
    };

    return (
        <div style={{
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            maxWidth: '900px',
            margin: '0 auto',
            background: '#1a1a1a',
            minHeight: '100vh',
            color: '#e5e5e5'
        }}>
            <h1 style={{
                fontSize: '28px',
                marginBottom: '8px',
                color: '#fff'
            }}>
                Model Pre-Loader
            </h1>
            <p style={{
                fontSize: '14px',
                color: '#999',
                marginBottom: '24px'
            }}>
                Generic loader for GOCAD models using @youwol/io (TS, PL, SO, VS)
            </p>

            <div style={{
                background: '#2a2a2a',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #333'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        marginBottom: '8px',
                        color: '#ccc'
                    }}>
                        Select Model:
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px',
                            background: '#1a1a1a',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {Object.keys(PREDEFINED_MODELS).map(key => (
                            <option key={key} value={key}>
                                {PREDEFINED_MODELS[key].name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{
                    padding: '12px',
                    background: '#1a1a1a',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: loading ? '#fbbf24' : '#10b981'
                }}>
                    <strong>Status:</strong> {status}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => loadModel(selectedModel)}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '500',
                            background: loading ? '#444' : '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        {loading ? 'Loading...' : 'Load Model'}
                    </button>

                    <button
                        onClick={clearCache}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '500',
                            background: loading ? '#444' : '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        Clear Cache
                    </button>
                </div>
            </div>

            {loadedFiles.length > 0 && (
                <div style={{
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    padding: '20px'
                }}>
                    <h2 style={{
                        fontSize: '18px',
                        marginTop: 0,
                        marginBottom: '16px',
                        color: '#fff'
                    }}>
                        Loaded Files ({loadedFiles.length})
                    </h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {loadedFiles.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '12px',
                                    background: '#1a1a1a',
                                    borderRadius: '6px',
                                    border: `1px solid ${item.status.includes('✓') ? '#10b981' : '#ef4444'}`,
                                    borderLeft: `4px solid ${item.status.includes('✓') ? '#10b981' : '#ef4444'}`
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px'
                                }}>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#fff'
                                    }}>
                                        {item.file}
                                    </span>
                                    <span style={{
                                        fontSize: '13px',
                                        color: item.status.includes('✓') ? '#10b981' : '#ef4444',
                                        fontWeight: '600'
                                    }}>
                                        {item.status}
                                    </span>
                                </div>
                                {item.info && (
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#999'
                                    }}>
                                        {item.info}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '24px',
                padding: '16px',
                background: '#854d0e',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#fef3c7',
                border: '1px solid #a16207'
            }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                    📦 Integration with @youwol/io
                </div>
                <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>
                    This component uses a simple fallback parser. To use the actual @youwol/io library:
                </p>
                <pre style={{
                    padding: '12px',
                    background: '#78350f',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    margin: 0
                }}>
                    {`import * as io from '@youwol/io'

// Decode TS (TSurf)
const ts = io.decoders.TS(fileContent)

// Decode PL (PLine)
const pl = io.decoders.PL(fileContent)

// Decode SO (Solid)
const so = io.decoders.SO(fileContent)

// Decode VS (VSet)
const vs = io.decoders.VS(fileContent)`}
                </pre>
            </div>
        </div>
    );
};

export default GenericModelPreLoader;
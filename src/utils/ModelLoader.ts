// src/utils/ModelLoader.ts
import * as THREE from 'three';
import { decodeGocadTS, decodeGocadPL, decodeGocadSO, decodeGocadVS } from '@youwol/io';
import type { DataFrame, Serie } from '@youwol/dataframe';
import { Manager } from '@youwol/dataframe';
import { PositionDecomposer } from '@youwol/math';
import { ComponentDecomposer } from '@youwol/math';
import { EigenValuesDecomposer } from '@youwol/math';
import { attributeDetector } from '@youwol/geophysics';

/**
 * Model file configuration
 */
export interface ModelFile {
    path: string;
    type: 'TS' | 'PL' | 'SO' | 'VS';
    name?: string;
    color?: string | number;
    isoContour?: boolean;
    visible?: boolean;
    geologicalType: 'Discontinuity' | 'Grid' | 'Unknown'
}

/**
 * Complete model configuration
 */
export interface ModelConfig {
    name: string;
    files: ModelFile[];
}

/**
 * Decoded GOCAD data structure (legacy for single mesh)
 */
export interface DecodedGOCAD {
    positions?: Float32Array;
    indices?: Uint32Array;
    segments?: Uint32Array;
    count: number;
    attributes?: { [key: string]: Float32Array };
}

/**
 * Loaded model data with Three.js objects
 * Now supports multiple meshes per file
 */
export interface LoadedModel {
    name: string;
    files: {
        file: ModelFile;
        dataframes: DataFrame[];
        meshes: (THREE.Mesh | THREE.LineSegments)[];
        managers: Manager[]; // One Manager per DataFrame
    }[];
}

/**
 * Helper to get available attribute names from a loaded model file
 */
export function getAttributeNames(loadedFile: LoadedModel['files'][0]): string[] {
    if (!loadedFile.dataframes || loadedFile.dataframes.length === 0) {
        console.warn('No dataframes available in loaded file');
        return [];
    }

    const dataframe = loadedFile.dataframes[0];

    if (loadedFile.managers && loadedFile.managers.length > 0) {
        const manager = loadedFile.managers[0];
        const names = manager.names(0);
        return names || [];
    }

    return [];
}

/**
 * Helper to get a Serie for a specific attribute from a loaded model file
 * Returns the Serie from the first DataFrame
 */
export function getAttributeSerie(
    loadedFile: LoadedModel['files'][0],
    attributeName: string
): Serie | undefined {
    if (!loadedFile.managers || loadedFile.managers.length === 0) {
        return undefined;
    }

    // Get serie from first manager
    return loadedFile.managers[0].serie(0, attributeName);
}

/**
 * Generic model loader for GOCAD files
 * Handles fetching, decoding via @youwol/io, and Three.js mesh creation
 */
export class ModelLoader {
    private cache: Map<string, DataFrame[]> = new Map();
    private loadedModels: Map<string, LoadedModel> = new Map();

    /**
     * Load a complete model configuration
     */
    async loadModel(config: ModelConfig, scene?: THREE.Scene): Promise<LoadedModel> {
        const loadedFiles: LoadedModel['files'] = [];

        for (const file of config.files) {
            try {
                const dataframes = await this.fetchAndDecode(file);
                const meshes = this.createMeshesFromDataFrames(dataframes, file);

                // Create one Manager per DataFrame
                const managers = dataframes.map(df => new Manager(df, {
                    decomposers: [
                        new PositionDecomposer,
                        new ComponentDecomposer,
                        new EigenValuesDecomposer,
                    ]
                }));

                if (scene) {
                    //if (!(file.isoContour && file.isoContour === true)) {
                        meshes.forEach(mesh => scene.add(mesh));
                    //}
                }

                loadedFiles.push({ file, dataframes, meshes, managers });
            } catch (error) {
                console.error(`Failed to load ${file.path}:`, error);
                loadedFiles.push({ file, dataframes: [], meshes: [], managers: [] });
            }
        }

        // Second pass: normalize all together
        const globalBox = new THREE.Box3();
        loadedFiles.forEach(f => {
            f.meshes.forEach(mesh => globalBox.expandByObject(mesh));
        });

        const center = globalBox.getCenter(new THREE.Vector3());
        const size = globalBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Apply same transformation to all meshes
        loadedFiles.forEach(f => {
            f.meshes.forEach(mesh => {
                const position = mesh.geometry.attributes.position;
                const array = position.array as Float32Array;

                // Translate to origin
                for (let i = 0; i < array.length; i += 3) {
                    array[i] -= center.x;
                    array[i + 1] -= center.y;
                    array[i + 2] -= center.z;
                }

                // Scale to unit size
                for (let i = 0; i < array.length; i += 3) {
                    array[i] *= 1.0 / maxDim;
                    array[i + 1] *= 1.0 / maxDim;
                    array[i + 2] *= 1.0 / maxDim;
                }

                position.needsUpdate = true;
                mesh.geometry.computeBoundingBox();
                mesh.geometry.computeBoundingSphere();
            });
        });

        const loadedModel: LoadedModel = {
            name: config.name,
            files: loadedFiles
        };

        this.loadedModels.set(config.name, loadedModel);
        return loadedModel;
    }

    /**
     * Fetch and decode a single file, returning DataFrame[]
     */
    async fetchAndDecode(file: ModelFile): Promise<DataFrame[]> {
        const cacheKey = file.path;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const response = await fetch(file.path);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${file.path}: ${response.statusText}`);
        }

        const text = await response.text();

        // Use @youwol/io decoders - these return DataFrame[]
        const dataframes = this.decodeWithYouwol(text, file.type);

        this.cache.set(cacheKey, dataframes);
        return dataframes;
    }

    /**
     * Decode using @youwol/io - returns DataFrame[]
     */
    private decodeWithYouwol(text: string, type: ModelFile['type']): DataFrame[] {
        switch (type) {
            case 'TS':
                return decodeGocadTS(text, {
                    shared: true,
                    merge: true
                });
            case 'PL':
                return decodeGocadPL(text);
            case 'SO':
                return decodeGocadSO(text);
            case 'VS':
                return decodeGocadVS(text);
            default:
                throw new Error(`Unknown file type: ${type}`);
        }
    }

    /**
     * Convert a single DataFrame to DecodedGOCAD format (for compatibility)
     */
    private dataFrameToDecodedGOCAD(df: DataFrame): DecodedGOCAD {
        const positions = df.series.positions?.array as Float32Array | undefined;
        const indices = df.series.indices?.array as Uint32Array | undefined;
        const segments = df.series.segments?.array as Uint32Array | undefined;

        const attributes: { [key: string]: Float32Array } = {};
        Object.keys(df.series).forEach(key => {
            if (key !== 'positions' && key !== 'indices' && key !== 'segments') {
                const serie = df.series[key];
                if (serie && serie.array instanceof Float32Array) {
                    attributes[key] = serie.array;
                }
            }
        });

        return {
            positions,
            indices,
            segments,
            count: positions ? positions.length / 3 : 0,
            attributes: Object.keys(attributes).length > 0 ? attributes : undefined
        };
    }

    /**
     * Create multiple Three.js meshes from DataFrame array
     */
    createMeshesFromDataFrames(
        dataframes: DataFrame[],
        file: ModelFile
    ): (THREE.Mesh | THREE.LineSegments)[] {
        const meshes: (THREE.Mesh | THREE.LineSegments)[] = [];

        dataframes.forEach((df, index) => {
            const decoded = this.dataFrameToDecodedGOCAD(df);
            const mesh = this.createMesh(decoded, file, index);
            if (mesh) {
                meshes.push(mesh);
            }
        });

        return meshes;
    }

    /**
     * Create a single mesh from decoded data
     */
    private createMesh(
        data: DecodedGOCAD,
        file: ModelFile,
        index: number = 0
    ): THREE.Mesh | THREE.LineSegments | null {
        if (!data.positions || data.count === 0) {
            return null;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));

        // Add custom attributes from DataFrame
        if (data.attributes) {
            Object.entries(data.attributes).forEach(([name, array]) => {
                geometry.setAttribute(name, new THREE.BufferAttribute(array, 1));
            });
        }

        // Handle triangulated surfaces (TS)
        if (data.indices && data.indices.length > 0) {
            geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
            geometry.computeVertexNormals();

            const material = new THREE.MeshPhongMaterial({
                color: file.color || 0x888888,
                side: THREE.DoubleSide,
                flatShading: false,
                transparent: true,
                opacity: 1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = `${file.name || file.path}_${index}`;
            mesh.visible = file.visible !== false;

            return mesh;
        }

        // Handle polylines (PL)
        if (data.segments && data.segments.length > 0) {
            geometry.setIndex(new THREE.BufferAttribute(data.segments, 1));

            const material = new THREE.LineBasicMaterial({
                color: file.color || 0xff0000,
                linewidth: 2
            });

            const lines = new THREE.LineSegments(geometry, material);
            lines.name = `${file.name || file.path}_${index}`;
            lines.visible = file.visible !== false;

            return lines;
        }

        return null;
    }

    /**
     * Get a loaded model by name
     */
    getModel(name: string): LoadedModel | undefined {
        return this.loadedModels.get(name);
    }

    /**
     * Get all meshes from a loaded model
     */
    getModelMeshes(name: string): (THREE.Mesh | THREE.LineSegments)[] {
        const model = this.loadedModels.get(name);
        if (!model) return [];

        return model.files.flatMap(f => f.meshes);
    }

    /**
     * Remove a model from the scene
     */
    removeModel(name: string, scene: THREE.Scene): void {
        const meshes = this.getModelMeshes(name);
        meshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh && mesh.geometry) {
                mesh.geometry.dispose();
                (mesh.material as THREE.Material).dispose();
            }
        });

        this.loadedModels.delete(name);
    }

    /**
     * Clear all cached data
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear all loaded models
     */
    clearModels(scene?: THREE.Scene): void {
        if (scene) {
            this.loadedModels.forEach((_, name) => {
                this.removeModel(name, scene);
            });
        }
        this.loadedModels.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { cachedFiles: number; loadedModels: number; totalMeshes: number } {
        let totalMeshes = 0;
        this.loadedModels.forEach(model => {
            model.files.forEach(file => {
                totalMeshes += file.meshes.length;
            });
        });

        return {
            cachedFiles: this.cache.size,
            loadedModels: this.loadedModels.size,
            totalMeshes
        };
    }
}



// Base path for models - to be adjusted based vite.config.ts base setting
const BASE_PATH = '/arch-platform';

/**
 * Predefined model configurations
 */
export const PREDEFINED_MODELS: { [key: string]: ModelConfig } = {
    Galapagos: {
        name: 'Galapagos',
        files: [
            {
                path: `${BASE_PATH}/models/Galapagos/Galapagos_obs.ts`,
                type: 'TS',
                name: 'Topography',
                color: 0x4ecdc4,
                isoContour: true,
                geologicalType: 'Grid'
            },
            {
                path: `${BASE_PATH}/models/Galapagos/all_Galapagos_magma_chambers.ts`,
                type: 'TS',
                name: 'Magma chambers',
                color: 0x666666,
                isoContour: false,
                geologicalType: 'Discontinuity'
            }
        ]
    },
    NashPoint: {
        name: 'NashPoint',
        files: [
            {
                path: `${BASE_PATH}/models/NashPoint/2D_grid.ts`,
                type: 'TS',
                name: '2D Grid',
                color: 0x95a5a6,
                isoContour: true,
                geologicalType: 'Grid',
                visible: true
            },
            {
                path: `${BASE_PATH}/models/NashPoint/NashPoint_faults.ts`,
                type: 'TS', name: 'Faults',
                color: 0x8888ff,
                isoContour: false,
                geologicalType: 'Discontinuity'
            },
            {
                path: `${BASE_PATH}/models/NashPoint/all_joints_3D.ts`,
                type: 'TS',
                name: 'Joints 3D',
                color: 0xff8888,
                isoContour: false,
                geologicalType: 'Unknown',
                visible: true
            },
            {
                path: `${BASE_PATH}/models/NashPoint/all_joints.pl`,
                type: 'PL',
                name: 'Joints Lines',
                color: 0xffffff,
                isoContour: false,
                geologicalType: 'Unknown',
                visible: true
            }
        ]
    },
    Tet: {
        name: 'Tet',
        files: [
            {
                path: `${BASE_PATH}/models/Tet/mnt.ts`,
                type: 'TS',
                name: 'Topography',
                color: 0x4ecdc4,
                isoContour: true,
                geologicalType: 'Grid'
            },
            {
                path: `${BASE_PATH}/models/Tet/faults.ts`,
                type: 'TS',
                name: 'Faults',
                color: 0x8888FF,
                isoContour: false,
                geologicalType: 'Discontinuity'
            }
        ]
    },
    Matelles: {
        name: 'Matelles',
        files: [
            {
                path: `${BASE_PATH}/models/Matelles/grid.ts`,
                type: 'TS',
                name: 'Topography',
                color: 0x4ecdc4,
                isoContour: true,
                geologicalType: 'Grid'
            },
            {
                path: `${BASE_PATH}/models/Matelles/faults_friction.ts`,
                type: 'TS',
                name: 'Faults',
                color: 0x8888FF,
                isoContour: false,
                geologicalType: 'Discontinuity'
            }
        ]
    }
};
// src/utils/ModelLoader.ts
import * as THREE from 'three';
import { decodeGocadTS, decodeGocadPL, decodeGocadSO, decodeGocadVS } from '@youwol/io';
import { weightedSum } from '@youwol/math'
import { DataFrame, Serie } from '@youwol/dataframe';
import { Manager } from '@youwol/dataframe';
import { PositionDecomposer } from '@youwol/math';
import { ComponentDecomposer } from '@youwol/math';
import { EigenValuesDecomposer } from '@youwol/math';
import { attributeDetector } from '@youwol/geophysics';
import { append } from '@youwol/dataframe';
import { insertSerie } from '@youwol/dataframe';
import { ReturnType, ReturnTypes } from './attributeDetector';
import { DecodedGOCAD, LoadedModel, ModelConfig, ModelFile } from './types';
import { simpleAndersonMapping } from './mapping';

export type AttributeFamilies = Record<string, string[]> // { prefix: [attr1, attr2, ...] }



// --------------------------------------------------------------------

/**
 * Helper to get available attribute names from a loaded model file
 */
// Beurk du [0]
export function getAttributeNames(loadedFile: LoadedModel['files'][0]): string[] {
    if (!loadedFile.dataframes || loadedFile.dataframes.length === 0) {
        console.warn('No dataframes available in loaded file');
        return [];
    }

    //const dataframe = loadedFile.dataframes[0];

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
// Beurk du [0]
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



// Beurk du [0]
export function doWeightedSum(loadedFile: LoadedModel['files'][0], theta: number, R: number) {
    //console.log(theta, R)
    const alpha = simpleAndersonMapping([theta, R])
    loadedFile.detects.forEach((detects, i) => detects.forEach(detect => {
        const df = loadedFile.dataframes[i]
        const udf = loadedFile.dataframesUser[i]
        const name = detect.name
        const nb = detect.end - detect.start + 1
        const S: Serie[] = []

        for (let i = detect.start; i <= detect.end; ++i) {
            S.push(df.series[`${name}${i}`])
        }

        const alpha_bis = new Array(nb).fill(1)

        const weightedSerie = weightedSum(S, alpha.length == nb ? alpha : alpha_bis)
        udf.series[name] = weightedSerie
    }))
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
                const dataframesUser: DataFrame[] = []

                const meshes = this.createMeshesFromDataFrames(dataframes, file);

                const allDetects: ReturnTypes[] = []

                // Create one Manager per DataFrame
                const managers = dataframes.map(df => {
                    // User dataframe
                    const udf = DataFrame.create({
                        series: {
                            positions: df.series.positions.clone()
                        }
                    })
                    if (df.series.indices) {
                        const clone = df.series.indices.clone()
                        udf.series['indices'] = clone
                    }
                    dataframesUser.push(udf)

                    const detects: ReturnTypes = attributeDetector(df)
                    // Fill the udf
                    detects.forEach((detect: ReturnType) => {
                        const name = detect.name
                        const nb = detect.end - detect.start + 1
                        const S: Serie[] = []

                        for (let i = detect.start; i <= detect.end; ++i) {
                            S.push(df.series[`${name}${i}`])
                        }

                        const weightedSerie = weightedSum(S, new Array(nb).fill(1))
                        udf.series[name] = weightedSerie
                        //console.log(name, nb, weightedSerie)
                    })

                    allDetects.push(detects)

                    const mng = new Manager(udf, {
                        decomposers: [
                            new PositionDecomposer,
                            new ComponentDecomposer,
                            new EigenValuesDecomposer,
                        ]
                    })
                    return mng
                });

                if (scene) {
                    meshes.forEach(mesh => scene.add(mesh));
                }

                loadedFiles.push({
                    detects: allDetects,
                    file,
                    dataframes,
                    dataframesUser,
                    meshes,
                    managers
                });
            } catch (error) {
                console.error(`Failed to load ${file.path}:`, error);
                loadedFiles.push({
                    detects: [],
                    file,
                    dataframes: [],
                    dataframesUser: [],
                    meshes: [],
                    managers: []
                });
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




// src/utils/ModelLoader.ts
import * as THREE from 'three';
// import * as io from '@youwol/io'; // Uncomment when @youwol/io is properly configured

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
}

/**
 * Complete model configuration
 */
export interface ModelConfig {
    name: string;
    files: ModelFile[];
}

/**
 * Decoded GOCAD data structure
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
 */
export interface LoadedModel {
    name: string;
    files: {
        file: ModelFile;
        data: DecodedGOCAD;
        mesh?: THREE.Mesh | THREE.LineSegments;
    }[];
}

/**
 * Generic model loader for GOCAD files
 * Handles fetching, decoding via @youwol/io, and Three.js mesh creation
 */
export class ModelLoader {
    private cache: Map<string, DecodedGOCAD> = new Map();
    private loadedModels: Map<string, LoadedModel> = new Map();

    /**
     * Load a complete model configuration
     */
    async loadModel(config: ModelConfig, scene?: THREE.Scene): Promise<LoadedModel> {
        const loadedFiles: LoadedModel['files'] = [];

        for (const file of config.files) {
            try {
                const data = await this.fetchAndDecode(file);
                const mesh = this.createMesh(data, file);

                if (mesh && scene) {
                    scene.add(mesh);
                }

                loadedFiles.push({ file, data, mesh });
            } catch (error) {
                console.error(`Failed to load ${file.path}:`, error);
                loadedFiles.push({ file, data: { count: 0 } });
            }
        }

        // // Second pass: normalize all together
        // const globalBox = new THREE.Box3();
        // loadedFiles.forEach(f => {
        //     if (f.mesh) globalBox.expandByObject(f.mesh);
        // });

        // const center = globalBox.getCenter(new THREE.Vector3());
        // const size = globalBox.getSize(new THREE.Vector3());
        // const maxDim = Math.max(size.x, size.y, size.z);

        // // Apply same transformation to all meshes
        // loadedFiles.forEach(f => {
        //     if (f.mesh) {
        //         f.mesh.position.set(-center.x, -center.y, -center.z);
        //         f.mesh.scale.set(1 / maxDim, 1 / maxDim, 1 / maxDim);
        //     }
        // });

        const loadedModel: LoadedModel = {
            name: config.name,
            files: loadedFiles
        };

        this.loadedModels.set(config.name, loadedModel);
        return loadedModel;
    }

    /**
     * Fetch and decode a single file
     */
    async fetchAndDecode(file: ModelFile): Promise<DecodedGOCAD> {
        const cacheKey = file.path;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const response = await fetch(file.path);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${file.path}: ${response.statusText}`);
        }

        const text = await response.text();

        // TODO: Use @youwol/io decoders when available
        // const decoded = this.decodeWithYouwol(text, file.type);

        // Fallback parser
        const decoded = this.parseGOCAD(text, file.type);

        this.cache.set(cacheKey, decoded);
        return decoded;
    }

    /**
     * Decode using @youwol/io (uncomment when library is configured)
     */
    /*
    private decodeWithYouwol(text: string, type: ModelFile['type']): DecodedGOCAD {
      switch (type) {
        case 'TS':
          return io.decoders.TS(text);
        case 'PL':
          return io.decoders.PL(text);
        case 'SO':
          return io.decoders.SO(text);
        case 'VS':
          return io.decoders.VS(text);
        default:
          throw new Error(`Unknown file type: ${type}`);
      }
    }
    */

    /**
     * Simple GOCAD parser (fallback)
     */
    private parseGOCAD(text: string, type: string): DecodedGOCAD {
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

    /**
     * Create Three.js mesh from decoded data
     */
    createMesh(
        data: DecodedGOCAD,
        file: ModelFile
    ): THREE.Mesh | THREE.LineSegments | null {
        if (!data.positions || data.count === 0) {
            return null;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));

        // Handle triangulated surfaces (TS)
        if (data.indices && data.indices.length > 0) {
            geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
            geometry.computeVertexNormals();

            const material = new THREE.MeshPhongMaterial({
                color: file.color || 0x888888,
                side: THREE.DoubleSide,
                flatShading: false,
                transparent: true,
                opacity: 0.8
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = file.name || file.path;
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
            lines.name = file.name || file.path;
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

        return model.files
            .map(f => f.mesh)
            .filter((m): m is THREE.Mesh | THREE.LineSegments => m !== undefined);
    }

    /**
     * Remove a model from the scene
     */
    removeModel(name: string, scene: THREE.Scene): void {
        const meshes = this.getModelMeshes(name);
        meshes.forEach(mesh => {
            scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
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
    getCacheStats(): { cachedFiles: number; loadedModels: number } {
        return {
            cachedFiles: this.cache.size,
            loadedModels: this.loadedModels.size
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
            { path: `${BASE_PATH}/models/Galapagos/all_Galapagos_magma_chambers.ts`, type: 'TS', name: 'Magama chambers', color: 0xff6b6b, isoContour: true },
            { path: `${BASE_PATH}/models/Galapagos/Galapagos_obs.ts`, type: 'TS', name: 'Topography', color: 0x4ecdc4, isoContour: false },
        ]
    },
    NashPoint: {
        name: 'Nash Point',
        files: [
            { path: `${BASE_PATH}/models/NashPoint/2D_grid.ts`, type: 'TS', name: '2D Grid', color: 0x95a5a6, isoContour: true },
            { path: `${BASE_PATH}/models/NashPoint/NashPoint_faults.ts`, type: 'TS', name: 'Faults', color: 0xff6b6b, isoContour: false },
            { path: `${BASE_PATH}/models/NashPoint/all_joints_3D.ts`, type: 'TS', name: 'Joints 3D', color: 0x000000, isoContour: false },
            { path: `${BASE_PATH}/models/NashPoint/all_joints.pl`, type: 'PL', name: 'Joints Lines', color: 0xffffff, isoContour: false }
        ]
    }
};  
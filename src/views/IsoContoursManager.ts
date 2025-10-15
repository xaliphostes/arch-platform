import * as THREE from 'three';
import {
    BufferGeometry,
    createIsoContourLines,
    createIsoContoursFilled,
    Float32BufferAttribute,
    Uint32BufferAttribute,
    ColorScale
} from '../keplerlit';
import { ModelLoader, getAttributeSerie } from '../utils/ModelLoader';

export interface IsoContourOptions {
    displayMode: 'filled' | 'lines' | 'both';
    numContours: number;
    colorTable: string;
    attribute: string;
}

export interface IsoContourState {
    filledMesh?: THREE.Mesh;
    linesMesh?: THREE.LineSegments;
}

/**
 * Manages iso-contour generation and visualization
 */
export class IsoContoursManager {
    private scene: THREE.Scene;
    private modelLoader: ModelLoader;
    private colorScale: ColorScale | null;
    private isoContourMeshes: Map<string, IsoContourState> = new Map();

    constructor(scene: THREE.Scene, modelLoader: ModelLoader, colorScale: ColorScale | null) {
        this.scene = scene;
        this.modelLoader = modelLoader;
        this.colorScale = colorScale;
    }

    /**
     * Clear all iso-contour meshes
     */
    clearAll(): void {
        this.isoContourMeshes.forEach(state => {
            if (state.filledMesh) {
                this.scene.remove(state.filledMesh);
                state.filledMesh.geometry.dispose();
                (state.filledMesh.material as THREE.Material).dispose();
            }
            if (state.linesMesh) {
                this.scene.remove(state.linesMesh);
                state.linesMesh.geometry.dispose();
                (state.linesMesh.material as THREE.Material).dispose();
            }
        });
        this.isoContourMeshes.clear();
    }

    /**
     * Clear iso-contours for specific files
     */
    clearForFiles(fileNames: string[]): void {
        fileNames.forEach(fileName => {
            const state = this.isoContourMeshes.get(fileName);
            if (!state) return;

            if (state.filledMesh) {
                this.scene.remove(state.filledMesh);
                state.filledMesh.geometry.dispose();
                (state.filledMesh.material as THREE.Material).dispose();
            }
            if (state.linesMesh) {
                this.scene.remove(state.linesMesh);
                state.linesMesh.geometry.dispose();
                (state.linesMesh.material as THREE.Material).dispose();
            }

            this.isoContourMeshes.delete(fileName);
        });
    }

    /**
     * Generate iso-contours for a specific file
     */
    generateForFile(
        fileData: any,
        options: IsoContourOptions,
        fileIndex: number = 0
    ): boolean {
        const { file, dataframes, meshes, managers } = fileData;

        if (meshes.length === 0 || dataframes.length === 0) {
            console.warn(`Skipping ${file.name}: missing meshes or dataframes`);
            return false;
        }

        try {
            // Get scalar field from selected attribute
            const scalarField = this.extractScalarField(fileData, options.attribute);
            if (scalarField.length === 0) {
                console.warn(`No scalar field data for ${file.name}`);
                return false;
            }

            // Get positions and indices from first mesh
            const firstMesh = meshes[0];
            const positionsArray = firstMesh.geometry.attributes.position.array;
            const indicesArray = firstMesh.geometry.index?.array;

            if (!indicesArray) {
                console.warn(`No indices for ${file.name}`);
                return false;
            }

            // Convert to keplerlit format
            const keplerPositions = new Float32BufferAttribute(Array.from(positionsArray), 3);
            const keplerIndices = new Uint32BufferAttribute(Array.from(indicesArray), 1);

            const keplerGeometry = new BufferGeometry();
            keplerGeometry.setPositions(keplerPositions);
            keplerGeometry.setIndices(keplerIndices);

            // Calculate contour levels
            const minVal = Math.min(...scalarField);
            const maxVal = Math.max(...scalarField);

            // Update ColorScale range
            if (this.colorScale && fileIndex === 0) {
                this.colorScale.updateRange(minVal, maxVal);
                this.colorScale.setColorMap(options.colorTable);
                this.colorScale.updateAttributeName(options.attribute);
            }

            const isoList: number[] = [];
            for (let i = 0; i < options.numContours; i++) {
                isoList.push(minVal + (i / (options.numContours - 1)) * (maxVal - minVal));
            }

            console.log(`Generating contours for ${file.name} using attribute "${options.attribute}": ${isoList.length} levels`);

            const state: IsoContourState = {};

            // Generate filled contours
            if (options.displayMode === 'filled' || options.displayMode === 'both') {
                state.filledMesh = this.createFilledContours(
                    keplerGeometry,
                    scalarField,
                    isoList,
                    options.colorTable,
                    file.name
                );
            }

            // Generate line contours
            if (options.displayMode === 'lines' || options.displayMode === 'both') {
                state.linesMesh = this.createLineContours(
                    keplerGeometry,
                    scalarField,
                    isoList,
                    options.colorTable,
                    file.name
                );
            }

            // Store state
            this.isoContourMeshes.set(file.name, state);

            // Hide original meshes when showing filled contours
            if (options.displayMode === 'filled' || options.displayMode === 'both') {
                meshes.forEach(mesh => mesh.visible = false);
            } else {
                meshes.forEach(mesh => mesh.visible = true);
            }

            return true;

        } catch (error) {
            console.error(`Error generating contours for ${file.name}:`, error);
            return false;
        }
    }

    /**
     * Extract scalar field from file data based on attribute
     */
    private extractScalarField(fileData: any, attribute: string): number[] {
        const { meshes, managers } = fileData;
        const scalarField: number[] = [];

        if (attribute === 'z') {
            const firstMesh = meshes[0];
            const positions = firstMesh.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                scalarField.push(positions[i + 2]);
            }
        } else if (managers && managers.length > 0) {
            const serie = getAttributeSerie(fileData, attribute);
            if (serie && serie.array) {
                return Array.from(serie.array);
            } else {
                console.warn(`Attribute ${attribute} not found, falling back to Z`);
                const firstMesh = meshes[0];
                const positions = firstMesh.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    scalarField.push(positions[i + 2]);
                }
            }
        } else {
            console.warn(`No managers available, using Z coordinates`);
            const firstMesh = meshes[0];
            const positions = firstMesh.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                scalarField.push(positions[i + 2]);
            }
        }

        return scalarField;
    }

    /**
     * Create filled contour mesh
     */
    private createFilledContours(
        geometry: BufferGeometry,
        scalarField: number[],
        isoList: number[],
        colorTable: string,
        fileName: string
    ): THREE.Mesh | undefined {
        const result = createIsoContoursFilled(geometry, scalarField, isoList, {
            lut: colorTable,
            nbColors: 512
        });

        if (!result) return undefined;

        const meshGeometry = new THREE.BufferGeometry();
        meshGeometry.setAttribute('position', new THREE.Float32BufferAttribute(result.position, 3));
        meshGeometry.setIndex(new THREE.Uint32BufferAttribute(result.index, 1));

        const colors = new Float32Array(result.color);
        meshGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        meshGeometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            wireframe: false,
            flatShading: false,
            polygonOffset: true,
            polygonOffsetFactor: 0.5
        });

        const contourMesh = new THREE.Mesh(meshGeometry, material);
        contourMesh.name = `${fileName}_isocontours_filled`;
        this.scene.add(contourMesh);

        console.log(`Created filled contours for ${fileName}`);
        return contourMesh;
    }

    /**
     * Create line contour mesh
     */
    private createLineContours(
        geometry: BufferGeometry,
        scalarField: number[],
        isoList: number[],
        colorTable: string,
        fileName: string
    ): THREE.LineSegments | undefined {
        const result = createIsoContourLines(geometry, scalarField, isoList, '#000000', colorTable);

        if (result.positions.length === 0) return undefined;

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(result.positions, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2
        });

        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        lines.name = `${fileName}_isocontours_lines`;
        this.scene.add(lines);

        console.log(`Created line contours for ${fileName}`);
        return lines;
    }

    /**
     * Get iso-contour state for a file
     */
    getState(fileName: string): IsoContourState | undefined {
        return this.isoContourMeshes.get(fileName);
    }

    /**
     * Check if file has iso-contours
     */
    hasIsoContours(fileName: string): boolean {
        return this.isoContourMeshes.has(fileName);
    }

    /**
     * Set visibility for iso-contours of a specific file
     */
    setVisibility(fileName: string, visible: boolean): void {
        const state = this.isoContourMeshes.get(fileName);
        if (!state) return;

        if (state.filledMesh) state.filledMesh.visible = visible;
        if (state.linesMesh) state.linesMesh.visible = visible;
    }
}
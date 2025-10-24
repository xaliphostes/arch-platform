import * as THREE from 'three';
import {
    BufferGeometry,
    createIsoContourLines,
    createIsoContoursFilled,
    Float32BufferAttribute,
    Uint32BufferAttribute,
    ColorScale
} from '../keplerlit';
import { ModelLoader } from './ModelLoader';

type Params = {
    scene: THREE.Scene;
    modelLoader: ModelLoader;
    colorScale: ColorScale | null; // keep as any if you prefer
};

export class IsoContoursManager {
    private scene: THREE.Scene;
    private modelLoader: ModelLoader;
    private colorScale: ColorScale | null;
    private isoMeshes = new Map<string, THREE.Object3D>(); // lines or mesh

    constructor({ scene, modelLoader, colorScale }: Params) {
        this.scene = scene;
        this.modelLoader = modelLoader;
        this.colorScale = colorScale;
    }

    clear() {
        this.isoMeshes.forEach(obj => {
            this.scene.remove(obj);
            const g = (obj as any).geometry as THREE.BufferGeometry | undefined;
            const m = (obj as any).material as THREE.Material | THREE.Material[] | undefined;
            g?.dispose();
            if (Array.isArray(m)) m.forEach(mm => mm.dispose());
            else m?.dispose();
        });
        this.isoMeshes.clear();
    }

    updateVisibility(opts: {
        loadedModelName: string | null;
        displayMode: 'filled' | 'lines' | 'both';
        fileVisualizationStates: Map<string, 'original' | 'iso'>;
        visibilityStates: Map<string, boolean>;
    }) {
        const { loadedModelName, displayMode, fileVisualizationStates, visibilityStates } = opts;
        if (!loadedModelName) return;
        const model = this.modelLoader.getModel(loadedModelName);
        if (!model) return;

        model.files.forEach(fileData => {
            const path = fileData.file.path;
            const defaultVisible = fileData.file.visible !== false;
            const shouldShow = visibilityStates.has(path) ? !!visibilityStates.get(path) : defaultVisible;
            const showIso = fileVisualizationStates.get(path) === 'iso';

            fileData.meshes.forEach((mesh, meshIndex) => {
                const filledKey = `${fileData.file.name}_mesh${meshIndex}_filled`;
                const linesKey = `${fileData.file.name}_mesh${meshIndex}_lines`;
                const filledObj = this.isoMeshes.get(filledKey) as THREE.Mesh | undefined;
                const linesObj = this.isoMeshes.get(linesKey) as THREE.LineSegments | undefined;

                if (!shouldShow) {
                    mesh.visible = false;
                    if (filledObj) filledObj.visible = false;
                    if (linesObj) linesObj.visible = false;
                    return;
                }

                if (showIso) {
                    if (filledObj) filledObj.visible = (displayMode === 'filled' || displayMode === 'both');
                    if (linesObj) linesObj.visible = (displayMode === 'lines' || displayMode === 'both');
                    mesh.visible = (displayMode === 'lines'); // keep originals in lines-only
                } else {
                    mesh.visible = true;
                    if (filledObj) filledObj.visible = false;
                    if (linesObj) linesObj.visible = false;
                }
            });
        });
    }

    async generate(opts: {
        loadedModelName: string | null;
        attribute: string;
        numContours: number;
        displayMode: 'filled' | 'lines' | 'both';
        colorTable: string;
        // optional: selection narrowing, if you re-enable that logic
    }) {
        const { loadedModelName, attribute, numContours, displayMode, colorTable } = opts;
        if (!loadedModelName) return;

        const loadedModel = this.modelLoader.getModel(loadedModelName);
        if (!loadedModel) return;

        // clear previous iso layers before regenerating
        this.clear();

        let first = true;

        loadedModel.files
            .filter(f => f.file.isoContour === true)
            .forEach((fileData, fileIndex) => {
                const { file, meshes, managers } = fileData;
                if (!meshes.length) return;

                meshes.forEach((mesh, meshIndex) => {
                    // -------- scalar field
                    let scalar: number[] = [];
                    if (attribute === 'z') {
                        const pos = mesh.geometry.attributes.position.array as ArrayLike<number>;
                        for (let i = 0; i < pos.length; i += 3) scalar.push(pos[i + 2]);
                    } else if (managers && managers.length > meshIndex) {
                        const mgr = managers[meshIndex];
                        const serie = mgr.serie(0, attribute);
                        scalar = (serie?.array) ? Array.from(serie.array) : [];
                        if (!scalar.length) {
                            const pos = mesh.geometry.attributes.position.array as ArrayLike<number>;
                            for (let i = 0; i < pos.length; i += 3) scalar.push(pos[i + 2]);
                        }
                    }

                    if (!scalar.length || !mesh.geometry.index) return;

                    // -------- convert to keplerlit buffers
                    const positionsArray = mesh.geometry.attributes.position.array as ArrayLike<number>;
                    const indicesArray = mesh.geometry.index.array as ArrayLike<number>;

                    const kPos = new Float32BufferAttribute(Array.from(positionsArray), 3);
                    const kIdx = new Uint32BufferAttribute(Array.from(indicesArray), 1);
                    const kGeom = new BufferGeometry();
                    kGeom.setPositions(kPos);
                    kGeom.setIndices(kIdx);

                    // -------- levels + colors
                    const minVal = Math.min(...scalar);
                    const maxVal = Math.max(...scalar);
                    const isoList = Array.from({ length: numContours }, (_, i) =>
                        minVal + (i / (numContours - 1)) * (maxVal - minVal)
                    );

                    if (this.colorScale && first) {
                        this.colorScale.updateRange(minVal, maxVal);
                        this.colorScale.setColorMap(colorTable);
                        this.colorScale.updateAttributeName(attribute);
                        first = false;
                    }

                    // -------- filled
                    if (displayMode === 'filled' || displayMode === 'both') {
                        const res = createIsoContoursFilled(kGeom, scalar, isoList, { lut: colorTable, nbColors: 512 });
                        if (res) {
                            const g = new THREE.BufferGeometry();
                            g.setAttribute('position', new THREE.Float32BufferAttribute(res.position, 3));
                            g.setIndex(new THREE.Uint32BufferAttribute(res.index, 1));
                            g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(res.color), 3));
                            g.computeVertexNormals();

                            const mat = new THREE.MeshPhongMaterial({
                                vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 0.5
                            });

                            const filled = new THREE.Mesh(g, mat);
                            filled.name = `${file.name}_mesh${meshIndex}_isocontours_filled`;
                            this.scene.add(filled);
                            this.isoMeshes.set(`${file.name}_mesh${meshIndex}_filled`, filled);
                        }
                    }

                    // -------- lines
                    if (displayMode === 'lines' || displayMode === 'both') {
                        const res = createIsoContourLines(kGeom, scalar, isoList, '#000000', colorTable);
                        if (res.positions.length) {
                            const g = new THREE.BufferGeometry();
                            g.setAttribute('position', new THREE.Float32BufferAttribute(res.positions, 3));
                            const mat = new THREE.LineBasicMaterial({ linewidth: 2 });
                            const lines = new THREE.LineSegments(g, mat);
                            lines.name = `${file.name}_mesh${meshIndex}_isocontours_lines`;
                            this.scene.add(lines);
                            this.isoMeshes.set(`${file.name}_mesh${meshIndex}_lines`, lines);
                        }
                    }
                });
            });
    }
}

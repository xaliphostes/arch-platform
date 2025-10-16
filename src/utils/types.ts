import { DataFrame } from "@youwol/dataframe";
import { ReturnTypes } from "./attributeDetector";
import { Manager } from "@youwol/dataframe";
import * as THREE from 'three';

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
        dataframesUser: DataFrame[];
        detects: ReturnTypes[];
        meshes: (THREE.Mesh | THREE.LineSegments)[];
        managers: Manager[]; // One Manager per DataFrame
    }[];
}
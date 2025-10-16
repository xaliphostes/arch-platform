import { ModelConfig } from "../utils/types";

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

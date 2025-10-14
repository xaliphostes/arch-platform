// Suppress type errors for @youwol packages
declare module '@youwol/io' {
    export const decoders: any;
    export default any;
}

declare module '@youwol/io/*' {
    const content: any;
    export default content;
}

declare module '@youwol/dataframe' {
    export default any;
}

declare module '@youwol/geometry' {
    export default any;
}

declare module '@youwol/math' {
    export default any;
}

declare module '@youwol/attribute' {
    export default any;
}

declare module '@youwol/geophysics' {
    export default any;
}

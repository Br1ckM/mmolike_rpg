/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// *** ADD THIS DECLARATION ***
declare module '*.yaml' {
    const data: any;
    export default data;
}

interface ImportMetaEnv {
    readonly VITE_APP_TITLE?: string
    // add more env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
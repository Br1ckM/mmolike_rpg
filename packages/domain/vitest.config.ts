import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true, // Use expect, it, etc. without importing
        environment: 'node', // Test in a Node.js environment
        include: ['src/__tests__/**/*.{test,spec}.ts'], // Where to find test files
    },
});
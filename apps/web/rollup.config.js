import yaml from '@rollup/plugin-yaml';

export default {
    input: 'src/index.js',
    output: {
        dir: 'output',
        format: 'cjs'
    },
    plugins: [yaml()]
};
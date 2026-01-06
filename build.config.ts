import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/module',
    { input: './src/cli/index.ts', name: 'cli/index' },
  ],
  externals: ['citty', 'consola', 'pathe'],
  rollup: {
    emitCJS: false,
  },
})

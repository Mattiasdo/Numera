import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vanilla: 'src/vanilla.ts',
  },
  format: ['esm'],
  sourcemap: false,
  clean: true,
  dts: true,
  external: ['react', 'react/jsx-runtime'],
});

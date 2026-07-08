import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vanilla: 'src/vanilla.ts',
  },
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  dts: true,
  external: ['react', 'react/jsx-runtime'],
});

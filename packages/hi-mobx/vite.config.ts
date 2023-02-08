import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      formats: ['es', 'umd'],
      fileName: (format) => `hi-mobx.${format}.js`,
    },
    rollupOptions: {
      external: ['mobx', 'lodash'],
      output: {
        globals: {
          mobx: 'mobx',
          lodash: 'lodash',
        },
      },
    },
  },
});

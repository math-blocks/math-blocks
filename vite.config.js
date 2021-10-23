import path from 'path';
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';

export default defineConfig({
  plugins: [reactRefresh()],
  resolve: {
    alias: [
      {
        find: /^@math-blocks\/(.*)$/,
        replacement: path.join(__dirname, 'packages/$1/src/index.ts'),
      },
    ],
  },
  publicDir: path.join(__dirname, 'assets'),
});

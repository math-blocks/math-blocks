import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const updateBasePlugin = () => {
  return {
    name: 'update-base',
    transformIndexHtml(html, ctx) {
      if (ctx.bundle) {
        return html.replace(
          '<base href="/" />',
          '<base href="/math-blocks/" />',
        );
      }
      return html;
    },
  };
};

export default defineConfig({
  plugins: [react(), updateBasePlugin()],
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: [
      {
        find: /^@math-blocks\/(.*)$/,
        replacement: path.join(__dirname, 'packages/$1/src/index.ts'),
      },
    ],
  },
});

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
    // Vite inlines assets under 4 KB as data URLs. Some font subsets are that
    // small, but inlining them would put them in the JavaScript bundle, so
    // they'd be downloaded whether or not a page uses that font. Keep every
    // font a separate file, loaded on demand.
    assetsInlineLimit: (filePath) =>
      /\.(otf|woff)$/.test(filePath) ? false : undefined,
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

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// GitHub Pages serves the app under /<repo-name>/. CI passes BASE_PATH from the repo name.
const pagesBase = process.env.BASE_PATH ?? '/cybershield-game/';

export default defineConfig(({ mode }) => {
  const offline = mode === 'offline';
  return {
    base: offline ? './' : pagesBase,
    plugins: [react(), tailwindcss(), ...(offline ? [viteSingleFile()] : [])],
    build: {
      outDir: offline ? 'dist-offline' : 'dist',
      emptyOutDir: true,
    },
    test: {
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'node',
    },
  };
});

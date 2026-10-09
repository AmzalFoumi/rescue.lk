import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.config.*',
        '**/layout.tsx',
        '.next/**',
        '**/*.test.{ts,tsx}',
        '**/testing/**',
        '**/*.d.ts',
      ],
      // The assignment grades each member's use case on its own, so every
      // use-case folder is held to 80% separately, plus an 80% floor for the
      // whole app. Without this, one member's high coverage could hide
      // another member's untested code in the total.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        ...Object.fromEntries(
          ['warnings', 'hazard-reports', 'response', 'analytics'].map(
            (useCase) => [
              `src/features/${useCase}/**`,
              { lines: 80, functions: 80, branches: 80, statements: 80 },
            ],
          ),
        ),
      },
    },
  },
});

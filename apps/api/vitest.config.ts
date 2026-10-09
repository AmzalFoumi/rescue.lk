import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/index.ts',
        'src/**/*.module.ts',
        'src/**/*.spec.ts',
        'src/**/*.fixture.ts',
      ],
      // The assignment grades each member's use case on its own, so every
      // use-case folder is held to 80% separately. Without this, one member's
      // high coverage could hide another member's untested code in the total.
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
        ...Object.fromEntries(
          ['warnings', 'hazard-reports', 'response', 'analytics'].map(
            (useCase) => [
              `src/modules/${useCase}/**`,
              { lines: 80, branches: 80, functions: 80, statements: 80 },
            ],
          ),
        ),
      },
    },
  },
});

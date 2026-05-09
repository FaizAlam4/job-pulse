import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/**/*.js'],
      exclude: [
        'src/index.js',
        'src/schemas/**',
        'src/routes/**',
        'src/services/ai/**',
        'src/services/resumeAnalyzerService.js',
        'src/controllers/resumeController.js',
      ],
      thresholds: {
        statements: 70,
        branches: 55,
        functions: 75,
        lines: 70,
      },
    },
    setupFiles: ['./tests/setup.js'],
  },
});

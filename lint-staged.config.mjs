export default {
  'apps/api/**/*.ts': [
    'prettier --write',
    (files) => `npx oxlint ${files.map((f) => `"${f}"`).join(' ')}`,
  ],
  'apps/web/**/*.{ts,tsx}': [
    'prettier --write',
    (files) => `npx --prefix apps/web eslint ${files.map((f) => `"${f}"`).join(' ')}`,
  ],
  'packages/shared/**/*.ts': ['prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};

/**
 * ESLint flat config (ESLint 9+ format). CLAUDE.md §7.1 references
 * .eslintrc.json, but ESLint 9 dropped legacy support; flat config is now
 * the only supported form.
 *
 * Rules encode the non-negotiables in CLAUDE.md §7.3 + §7.5:
 *   - no `any` types (rule 2)
 *   - no default exports (§7.5)
 *   - console allow-list keeps debug logs out of production user-facing UI
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/', '.playwright-mcp/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'No default exports — use named exports (CLAUDE.md §7.5).',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['tools/**/*.ts', 'tests/**/*.ts'],
    rules: {
      // Tooling scripts may log freely to stdout — that's their job.
      'no-console': 'off',
    },
  },
  {
    // Config files at repo root must default-export their config object —
    // it's the API the respective tool consumes.
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  prettier,
);

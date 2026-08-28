import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      'dist-static/**',
      '**/node_modules/**',
      'apps/**/dist/**',
      'apps/api/dist/**',
      'apps/admin/dist/**',
      'apps/landing/dist/**',
      '**/.next/**',
      'apps/landing/out/**',
      '.cache/**',
      '**/.cache/**',
      '.turbo/**',
      '**/.turbo/**',
      'coverage/**',
      '**/coverage/**',
      'build/**',
      '**/build/**',
      '.tmp-vercel/**',
      'restore-backups/**',
      'BACHMAIN_DOCUMENT_CENTER/**',
      '**/*.min.js',
      // TypeScript is typechecked by tsc (npm run typecheck:api / typecheck:ai).
      // Default ESLint parser cannot parse .ts/.tsx; CLI globs that only match
      // ignored files also fail ESLint 9 ("all files matching glob are ignored").
      '**/*.{ts,tsx}',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Warn-first: do not flood CI during JSX → TS transition
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'warn',
      'no-empty': 'warn',
      'no-console': 'off',
      'no-useless-escape': 'warn',
      'no-unsafe-optional-chaining': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-dupe-keys': 'warn',
      'no-redeclare': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]

import globals from 'globals';
import react from 'eslint-plugin-react';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig } from 'eslint/config';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig([
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react': react,
      'unused-imports': unusedImports,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^[A-Z_]',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
     settings: {
      react: { version: 'detect' },
    },
  },
]);
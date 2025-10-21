// eslint.config.mjs
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // 1) Игнорим артефакты сборки и генерации
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/generated/**',          // <- prisma/wasm и прочее
      '**/prisma/**',
      '**/*.min.js'
    ]
  },

  // 2) Базовые правила JS + TS
  js.configs.recommended,
  ...tseslint.configs.recommended, // можно заменить на recommendedTypeChecked, если есть строгий tsconfig

  // 3) Наши исходники
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        // если есть tsconfig.json в корне — оставь:
        // project: ['./tsconfig.json'],
        // tsconfigRootDir: new URL('.', import.meta.url)
      }
    },
    rules: {
      // меньше шума от неиспользуемых — игнорим переменные/аргументы с префиксом _
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern:  '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      // отключи, если временно нужна гибкость
      '@typescript-eslint/no-explicit-any': 'off',

      // часто встречается в шаблонных выражениях
      '@typescript-eslint/no-unused-expressions': ['warn', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true
      }]
    }
  },

  // 4) Локальное послабление для pdf-рендера, если нужно
  {
    files: ['src/pdf/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' }
  }
];

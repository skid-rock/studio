import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// Flat-config ESLint. Prettier подключён последним — отключает правила
// форматирования, чтобы не конфликтовать с самим Prettier.
export default tseslint.config(
  // spikes/ — одноразовые спайки (напр. STUDIO-008), вне прод-сборки и линта.
  { ignores: ['dist', 'spikes'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Граница «ядро ↛ React/движок» (STUDIO-027):
  // render-core и sections — агностичный TS, они не должны тянуть React и движки редактора.
  // Нарушение обнаруживается линтом (make lint), а не только ревью глазами.
  {
    files: ['src/render-core/**/*.{ts,tsx}', 'src/sections/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message:
                'render-core/sections агностичны к React — импорт запрещён (ADR-0001, STUDIO-027).',
            },
            {
              group: ['@measured/puck', '@measured/puck/*'],
              message:
                'render-core/sections не должны зависеть от Puck-редактора (ADR-0001, STUDIO-027).',
            },
            {
              group: ['@craftjs/core', '@craftjs/core/*'],
              message:
                'render-core/sections не должны зависеть от CraftJS-редактора (ADR-0001, STUDIO-027).',
            },
            {
              group: ['**/editor', '**/editor/**'],
              message:
                'render-core/sections не должны импортировать из editor/ (ADR-0001, STUDIO-027).',
            },
          ],
        },
      ],
    },
  },
  prettier,
);

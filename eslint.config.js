import js from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// Flat-config ESLint. eslint-config-prettier отключает правила, конфликтующие с Prettier.
// @stylistic/padding-line-between-statements — после prettier: с Prettier не конфликтует.
export default tseslint.config(
    { ignores: ['dist'] },
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
                            group: [
                                'react',
                                'react/*',
                                'react-dom',
                                'react-dom/*',
                            ],
                            message:
                                'render-core/sections агностичны к React — импорт запрещён (ADR-0001, STUDIO-027).',
                        },
                        {
                            group: ['@measured/puck', '@measured/puck/*'],
                            message:
                                'render-core/sections не должны зависеть от Puck-редактора (ADR-0001, STUDIO-027; движок удалён в STUDIO-035).',
                        },
                        {
                            group: ['@craftjs/core', '@craftjs/core/*'],
                            message:
                                'render-core/sections не должны зависеть от CraftJS-редактора (ADR-0001, STUDIO-027; движок удалён в STUDIO-035).',
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
    // Граница «ядро редактирования ↛ React/движок» (STUDIO-031):
    // editor-core — агностичный стор StudioDocument (selection, история, команды) без UI.
    // Зависит только от render-core; React/Puck/Craft и React-оболочка src/editor/ запрещены.
    {
        files: ['src/editor-core/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                'react',
                                'react/*',
                                'react-dom',
                                'react-dom/*',
                            ],
                            message:
                                'editor-core агностичен к React — импорт запрещён (STUDIO-031).',
                        },
                        {
                            group: ['@measured/puck', '@measured/puck/*'],
                            message:
                                'editor-core не зависит от Puck — стор строится на StudioDocument (STUDIO-031; движок удалён в STUDIO-035).',
                        },
                        {
                            group: ['@craftjs/core', '@craftjs/core/*'],
                            message:
                                'editor-core не зависит от CraftJS (STUDIO-031; движок удалён в STUDIO-035).',
                        },
                        {
                            group: ['**/editor', '**/editor/**'],
                            message:
                                'editor-core — верхний слой относительно React-оболочки src/editor/; импорт из editor/ запрещён (STUDIO-031).',
                        },
                    ],
                },
            ],
        },
    },
    // editor — собственный редактор без Puck/CraftJS (STUDIO-032, выпил движка —
    // STUDIO-035, ADR-0005). Машинная гарантия эпика «редактор без Puck».
    {
        files: ['src/editor/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@measured/puck', '@measured/puck/*'],
                            message:
                                'editor — собственный редактор без Puck/CraftJS (STUDIO-032, выпил движка — STUDIO-035, ADR-0005).',
                        },
                        {
                            group: ['@craftjs/core', '@craftjs/core/*'],
                            message:
                                'editor — собственный редактор без Puck/CraftJS (STUDIO-032, выпил движка — STUDIO-035, ADR-0005).',
                        },
                    ],
                },
            ],
        },
    },
    prettier,
    // Вертикальные отступы между логическими блоками (autofix через eslint --fix).
    // Prettier их не добавляет; правило совместимо с eslint-config-prettier.
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            // if/else/for/while/do — только с фигурными скобами (autofix; правило ядра ESLint).
            curly: ['error', 'all'],
            '@stylistic/padding-line-between-statements': [
                'error',
                // return всегда отделён пустой строкой от предыдущего statement.
                { blankLine: 'always', prev: '*', next: 'return' },
                // const/let/var не сливаются с for/if/while/...
                {
                    blankLine: 'always',
                    prev: ['const', 'let', 'var'],
                    next: [
                        'block-like',
                        'break',
                        'case',
                        'continue',
                        'default',
                        'do',
                        'for',
                        'if',
                        'switch',
                        'throw',
                        'try',
                        'while',
                    ],
                },
                // соседние объявления — без лишних пустых строк.
                {
                    blankLine: 'any',
                    prev: ['const', 'let', 'var'],
                    next: ['const', 'let', 'var'],
                },
            ],
        },
    },
);

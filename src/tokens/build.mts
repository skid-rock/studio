/**
 * Билд CSS-тем из DTCG-токенов (Style Dictionary, программный API v5).
 * Для каждой темы из реестра: base/** + themes/<id>/** → dist/<id>.css.
 * Запускается npm-скриптом `tokens` (вместо прежнего style-dictionary build по config.json).
 */
import StyleDictionary from 'style-dictionary';

import { THEMES } from './themes.ts';

// CSS-переменные: имена kebab, цвет, шрифт, easing, время;
// shadow/css/shorthand склеивает массив слоёв (в т.ч. inset) в box-shadow (STUDIO-057).
const TRANSFORMS = [
    'name/kebab',
    'color/css',
    'fontFamily/css',
    'cubicBezier/css',
    'time/seconds',
    'shadow/css/shorthand',
];

for (const { id } of THEMES) {
    const sd = new StyleDictionary({
        source: [
            'src/tokens/source/base/**/*.json',
            `src/tokens/source/themes/${id}/**/*.json`,
        ],
        platforms: {
            css: {
                transforms: TRANSFORMS,
                buildPath: 'src/tokens/dist/',
                files: [
                    {
                        destination: `${id}.css`,
                        format: 'css/variables',
                        options: { outputReferences: true },
                    },
                ],
            },
        },
    });

    await sd.buildAllPlatforms();
    console.log(`Тема собрана: dist/${id}.css`);
}

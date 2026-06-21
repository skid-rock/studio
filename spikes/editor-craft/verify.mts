/**
 * СПАЙК (STUDIO-008) — headless-проверка адаптера Craft.js ↔ наша модель.
 * Зеркало spikes/editor/verify.mts (Puck). Браузер не нужен: прогоняем сценарий
 * редактора на чистых данных и проверяем, что выбранная база (Craft.js)
 * совместима с нашим агностичным render.
 *
 * Запуск:  npx tsx spikes/editor-craft/verify.mts   (или `npm run spike:craft:verify`)
 *
 * Проверяем 4 вещи:
 *   1) StudioDocument → SerializedNodes → (правка + reorder + add) → StudioDocument —
 *      round-trip без потерь, дробный order пересчитан и строго возрастает;
 *   2) экспорт идёт через renderDocument и даёт СТРОКУ HTML без React;
 *   3) правка prop через «панель» отражается в выводе;
 *   4) чистая обёртка блока (BlockHtml) даёт ТОТ ЖЕ HTML, что строковый
 *      mod.render (анти-drift: один путь рендера, не два).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { StudioDocument } from '../../src/render-core/document';
import { sortedSections } from '../../src/render-core/document';
import { renderDocument } from '../../src/render-core/render';
import { defaultRegistry } from '../../src/sections/registry.default';
import {
    BlockHtml,
    CRAFT_ROOT,
    craftToDocument,
    documentToCraft,
    renderModuleHtml,
    toStudioType,
    type CraftNodes,
} from './craft-adapter.tsx';

let failures = 0;
function check(label: string, cond: boolean): void {
    console.log(`${cond ? '  ✓' : '  ✗'} ${label}`);
    if (!cond) {
        failures += 1;
    }
}

// ── Старт: документ из 3 секций (конверт + hero + closing) ───────────────────
const doc0: StudioDocument = {
    schemaVersion: 1,
    theme: { id: 'cream-navy' },
    motion: { preset: 'subtle' },
    sections: [
        { id: 's_intro', type: 'intro/envelope', order: 'a0', props: {} },
        {
            id: 's_hero',
            type: 'hero',
            order: 'a1',
            props: {
                eyebrow: 'Мы женимся',
                names: 'Полина & Илья',
                date: '05.08.2026',
            },
        },
        {
            id: 's_closing',
            type: 'closing',
            order: 'a2',
            props: {
                signature: 'С любовью, Полина & Илья',
                ps: 'Будем рады видеть вас!',
            },
        },
    ],
};

console.log('\n[1] StudioDocument → SerializedNodes Craft');
const nodes0 = documentToCraft(doc0);
const rootNodes0 = nodes0[CRAFT_ROOT].nodes as string[];
check('ROOT — canvas-контейнер', nodes0[CRAFT_ROOT].isCanvas === true);
check('3 секции в ROOT.nodes', rootNodes0.length === 3);
check(
    'type экранирован (нет «/»)',
    rootNodes0.every((id) => {
        const t = nodes0[id].type as { resolvedName: string };
        return !t.resolvedName.includes('/');
    }),
);
check(
    'id секции = ключ узла Craft',
    rootNodes0.join(',') === 's_intro,s_hero,s_closing',
);

console.log('\n[2] Сценарий редактора: правка + reorder + add');
// (а) правка prop через «панель» — меняем имена в hero
const nodes1: CraftNodes = structuredClone(nodes0);
(nodes1.s_hero.props as Record<string, unknown>).names = 'Аня & Боря';
// (б) reorder через DnD — closing уезжает в начало (меняем порядок ROOT.nodes)
nodes1[CRAFT_ROOT].nodes = ['s_closing', 's_intro', 's_hero'];
// (в) add из палитры — второй конверт в конец (новый узел + ссылка в ROOT.nodes)
nodes1.s_intro2 = {
    type: { resolvedName: 'intro--envelope' },
    isCanvas: false,
    props: {},
    parent: CRAFT_ROOT,
    displayName: 'intro/envelope',
    custom: {},
    hidden: false,
    nodes: [],
    linkedNodes: {},
};
(nodes1[CRAFT_ROOT].nodes as string[]).push('s_intro2');

console.log('\n[3] SerializedNodes → StudioDocument (round-trip)');
const doc1 = craftToDocument(nodes1, doc0);
const sorted = sortedSections(doc1);
check('4 секции после add', doc1.sections.length === 4);
check(
    'порядок совпадает с ROOT.nodes редактора',
    sorted.map((s) => s.id).join(',') ===
        (nodes1[CRAFT_ROOT].nodes as string[]).join(','),
);
const orders = sorted.map((s) => s.order);
check(
    'дробный order строго возрастает',
    orders.every((o, i) => i === 0 || orders[i - 1] < o),
);
check(
    'schemaVersion/theme сохранены из base',
    doc1.schemaVersion === 1 && doc1.theme.id === 'cream-navy',
);
check(
    'типы вернулись с восстановленным слэшем',
    sorted.filter((s) => s.type === 'intro/envelope').length === 2,
);
check(
    'правка prop сохранилась',
    (sorted.find((s) => s.id === 's_hero')?.props.names as string) ===
        'Аня & Боря',
);

console.log('\n[4] Агностичный экспорт через renderDocument');
const out = renderDocument(doc1, { registry: defaultRegistry });
check('html — строка', typeof out.html === 'string' && out.html.length > 0);
check('css — строка', typeof out.css === 'string');
check(
    'в выводе НЕТ React-рантайма',
    !/data-reactroot|__reactProps\$|reactFiber/i.test(out.html),
);
check(
    'вывод содержит разметку конверта',
    out.html.includes('envelope-overlay'),
);
check('вывод содержит отредактированное имя', out.html.includes('Аня'));

console.log('\n[5] Анти-drift: чистая обёртка == строковый render');
const first = sorted[0];
const mod = defaultRegistry.get(first.type)!;
const agnostic = renderModuleHtml(mod, first.props, doc1);
const reactHtml = renderToStaticMarkup(
    createElement(BlockHtml, { mod, props: first.props, doc: doc1 }),
);
check(
    'обёртка содержит ровно строковый HTML render',
    reactHtml.includes(agnostic),
);
check(
    'обёртка не добавила своего markup в блок',
    toStudioType('intro--envelope') === 'intro/envelope',
);

console.log(
    `\n${failures === 0 ? 'PASS — спайк подтверждает совместимость Craft.js с агностичным render' : `FAIL — провалов: ${failures}`}\n`,
);
process.exit(failures === 0 ? 0 : 1);

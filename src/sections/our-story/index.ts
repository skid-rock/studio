/**
 * Текстовый блок our-story — заголовок и вехи (дата + текст).
 * Повторы смоделированы фиксированными слотами (схема скалярная): m1..m4.
 * Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface StoryProps extends Record<string, unknown> {
    title: string;
    d1: string;
    t1: string;
    d2: string;
    t2: string;
    d3: string;
    t3: string;
    d4: string;
    t4: string;
}

// Фиксированные слоты вех: 4 пары (дата + текст). Пустые слоты не рендерятся.
const schema: ParamSchema = [
    {
        group: 'Наша история',
        items: [
            { key: 'title', label: 'Заголовок', type: 'text', def: 'Наша история' },

            { key: 'd1', label: 'Веха 1 — дата', type: 'text', def: '2019' },
            { key: 't1', label: 'Веха 1 — текст', type: 'text', def: 'Познакомились' },

            { key: 'd2', label: 'Веха 2 — дата', type: 'text', def: '2022' },
            { key: 't2', label: 'Веха 2 — текст', type: 'text', def: 'Начали жить вместе' },

            { key: 'd3', label: 'Веха 3 — дата', type: 'text', def: '2025' },
            { key: 't3', label: 'Веха 3 — текст', type: 'text', def: 'Сделал предложение' },

            { key: 'd4', label: 'Веха 4 — дата', type: 'text', def: '' },
            { key: 't4', label: 'Веха 4 — текст', type: 'text', def: '' },
        ],
    },
];

const css = `
.s-story {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
}
.s-story__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  text-align: center;
  margin: 0 0 2rem;
}
.s-story__list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 36rem;
}
.s-story__item + .s-story__item {
  margin-top: 1.5rem;
}
.s-story__date {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin: 0 0 0.25rem;
  opacity: 0.85;
}
.s-story__text {
  font-family: var(--font-body);
  margin: 0;
}
`;

export const storyModule: BlockModule<StoryProps> = {
    type: 'our-story',
    label: 'Наша история (вехи)',
    schema,
    defaults: defaultsFromSchema<StoryProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<StoryProps>(schema), ...p };

        // n — исходный номер слота (для якоря data-prop по ключу схемы).
        const slots = [
            { n: 1, date: props.d1, text: props.t1 },
            { n: 2, date: props.d2, text: props.t2 },
            { n: 3, date: props.d3, text: props.t3 },
            { n: 4, date: props.d4, text: props.t4 },
        ];

        const items = slots
            // пустой слот (обе строки пусты) не рендерится
            .filter((s) => s.date.trim() !== '' || s.text.trim() !== '')
            .map(
                (s) => `
      <li class="s-story__item">
        <p class="s-story__date" data-prop="d${s.n}">${esc(s.date)}</p>
        <p class="s-story__text" data-prop="t${s.n}">${esc(s.text)}</p>
      </li>`,
            )
            .join('');

        return `
    <section class="s-story">
      <h2 class="s-story__title" data-prop="title">${esc(props.title)}</h2>
      <ol class="s-story__list">${items}
      </ol>
    </section>`;
    },
    css,
};

function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

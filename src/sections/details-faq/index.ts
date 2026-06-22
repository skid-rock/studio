/**
 * Текстовый блок details-faq — список «вопрос — ответ».
 * Повторы смоделированы фиксированными слотами (схема скалярная): 4 пары q/a.
 * Пустые слоты не рендерятся. Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface FaqProps extends Record<string, unknown> {
    title: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
}

// Заголовок + 4 пары (вопрос + ответ). Пустые пары не рендерятся.
const schema: ParamSchema = [
    {
        group: 'Детали / FAQ',
        items: [
            { key: 'title', label: 'Заголовок', type: 'text', def: 'Детали' },

            {
                key: 'q1',
                label: 'Вопрос 1',
                type: 'text',
                def: 'Можно с детьми?',
            },
            {
                key: 'a1',
                label: 'Ответ 1',
                type: 'text',
                def: 'Да, конечно — будем рады всей семье.',
            },

            {
                key: 'q2',
                label: 'Вопрос 2',
                type: 'text',
                def: 'Где парковка?',
            },
            {
                key: 'a2',
                label: 'Ответ 2',
                type: 'text',
                def: 'Бесплатная стоянка у входа в ресторан.',
            },

            {
                key: 'q3',
                label: 'Вопрос 3',
                type: 'text',
                def: 'Дарить ли подарки?',
            },
            {
                key: 'a3',
                label: 'Ответ 3',
                type: 'text',
                def: 'Ваше присутствие — лучший подарок.',
            },

            { key: 'q4', label: 'Вопрос 4', type: 'text', def: '' },
            { key: 'a4', label: 'Ответ 4', type: 'text', def: '' },
        ],
    },
];

const css = `
.s-faq {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
}
.s-faq__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  text-align: center;
  margin: 0 0 2rem;
}
.s-faq__list {
  margin: 0 auto;
  max-width: 36rem;
}
.s-faq__item + .s-faq__item {
  margin-top: 1.5rem;
}
.s-faq__q {
  font-family: var(--font-display);
  font-size: 1.1rem;
  margin: 0 0 0.25rem;
}
.s-faq__a {
  font-family: var(--font-body);
  margin: 0;
  opacity: 0.85;
}
`;

export const faqModule: BlockModule<FaqProps> = {
    type: 'details-faq',
    label: 'Детали / FAQ (вопрос-ответ)',
    schema,
    defaults: defaultsFromSchema<FaqProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<FaqProps>(schema), ...p };

        // n — исходный номер слота (для якоря data-prop по ключу схемы).
        const slots = [
            { n: 1, q: props.q1, a: props.a1 },
            { n: 2, q: props.q2, a: props.a2 },
            { n: 3, q: props.q3, a: props.a3 },
            { n: 4, q: props.q4, a: props.a4 },
        ];

        const items = slots
            .filter((s) => s.q.trim() !== '' || s.a.trim() !== '')
            .map(
                (s) => `
      <div class="s-faq__item">
        <dt class="s-faq__q" data-prop="q${s.n}">${esc(s.q)}</dt>
        <dd class="s-faq__a" data-prop="a${s.n}">${esc(s.a)}</dd>
      </div>`,
            )
            .join('');

        return `
    <section class="s-faq">
      <h2 class="s-faq__title" data-prop="title">${esc(props.title)}</h2>
      <dl class="s-faq__list">${items}
      </dl>
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

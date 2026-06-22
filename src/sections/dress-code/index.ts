/**
 * Текстовый блок dress-code — заголовок, описание дресс-кода и палитра-подсказка.
 * Палитра — до 4 образцов цвета (swatch). Пустые образцы (пустая строка) не
 * рендерятся. Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface DressCodeProps extends Record<string, unknown> {
    title: string;
    text: string;
    c1: string;
    c2: string;
    c3: string;
    c4: string;
}

// Заголовок + описание + 4 слота-образца палитры (тип color). Пустой образец
// (пустая строка) не рендерится — пустых swatch не будет.
const schema: ParamSchema = [
    {
        group: 'Дресс-код',
        items: [
            { key: 'title', label: 'Заголовок', type: 'text', def: 'Дресс-код' },
            {
                key: 'text',
                label: 'Описание',
                type: 'text',
                def: 'Будем благодарны, если поддержите палитру торжества.',
            },
            { key: 'c1', label: 'Образец 1', type: 'color', def: '#275889' },
            { key: 'c2', label: 'Образец 2', type: 'color', def: '#c97b63' },
            { key: 'c3', label: 'Образец 3', type: 'color', def: '#f3ece1' },
            { key: 'c4', label: 'Образец 4', type: 'color', def: '' },
        ],
    },
];

const css = `
.s-dress {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
  text-align: center;
}
.s-dress__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  margin: 0 0 1rem;
}
.s-dress__text {
  font-family: var(--font-body);
  max-width: 32rem;
  margin: 0 auto 1.5rem;
}
.s-dress__palette {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}
.s-dress__swatch {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-navy);
}
`;

export const dressCodeModule: BlockModule<DressCodeProps> = {
    type: 'dress-code',
    label: 'Дресс-код (палитра)',
    schema,
    defaults: defaultsFromSchema<DressCodeProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<DressCodeProps>(schema), ...p };

        // Образцы палитры: пустой цвет (пустая строка) пропускаем.
        const swatches = [props.c1, props.c2, props.c3, props.c4]
            .filter((c) => c.trim() !== '')
            // value цвета подставляем в style — НЕ через data-prop (правится
            // палитрой панели свойств, не inline-текстом). esc на всякий случай.
            .map(
                (c) =>
                    `<span class="s-dress__swatch" style="background:${esc(c)}" aria-hidden="true"></span>`,
            )
            .join('');

        const palette = swatches
            ? `<div class="s-dress__palette">${swatches}</div>`
            : '';

        return `
    <section class="s-dress">
      <h2 class="s-dress__title" data-prop="title">${esc(props.title)}</h2>
      <p class="s-dress__text" data-prop="text">${esc(props.text)}</p>
      ${palette}
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

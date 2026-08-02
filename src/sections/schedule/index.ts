/**
 * Текстовый блок schedule — таймлайн дня.
 * Повторы — фиксированные слоты item1…item5 (одна строка = время + событие).
 * Дефолты — из макета Section/Schedule. Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface ScheduleProps extends Record<string, unknown> {
    title: string;
    item1: string;
    item2: string;
    item3: string;
    item4: string;
    item5: string;
}

// Фиксированные слоты пунктов. Пустые не рендерятся.
const schema: ParamSchema = [
    {
        group: 'Расписание',
        items: [
            {
                key: 'title',
                label: 'Заголовок',
                type: 'text',
                def: 'ПРОГРАММА ДНЯ',
            },
            {
                key: 'item1',
                label: 'Пункт 1',
                type: 'text',
                def: '16:00 Сбор гостей',
            },
            {
                key: 'item2',
                label: 'Пункт 2',
                type: 'text',
                def: '17:00 Церемония',
            },
            {
                key: 'item3',
                label: 'Пункт 3',
                type: 'text',
                def: '18:00 Банкет',
            },
            {
                key: 'item4',
                label: 'Пункт 4',
                type: 'text',
                def: '21:00 Фейерверк',
            },
            {
                key: 'item5',
                label: 'Пункт 5',
                type: 'text',
                def: '',
            },
        ],
    },
];

const css = `
.s-schedule {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
}
.s-schedule__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  text-align: center;
  margin: 0 0 2rem;
}
.s-schedule__list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 32rem;
}
.s-schedule__item {
  font-family: var(--font-body);
  margin: 0;
}
.s-schedule__item + .s-schedule__item {
  margin-top: 1rem;
}
`;

export const scheduleModule: BlockModule<ScheduleProps> = {
    type: 'schedule',
    label: 'Расписание дня',
    schema,
    defaults: defaultsFromSchema<ScheduleProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<ScheduleProps>(schema), ...p };

        // n — исходный номер слота (для якоря data-prop по ключу схемы).
        const slots = [
            { n: 1, text: props.item1 },
            { n: 2, text: props.item2 },
            { n: 3, text: props.item3 },
            { n: 4, text: props.item4 },
            { n: 5, text: props.item5 },
        ];

        const items = slots
            .filter((s) => s.text.trim() !== '')
            .map(
                (s) => `
      <li class="s-schedule__item" data-prop="item${s.n}">${esc(s.text)}</li>`,
            )
            .join('');

        return `
    <section class="s-schedule">
      <h2 class="s-schedule__title" data-prop="title">${esc(props.title)}</h2>
      <ol class="s-schedule__list">${items}
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

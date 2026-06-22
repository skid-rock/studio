/**
 * Текстовый блок schedule — таймлайн дня (время + событие).
 * Повторы смоделированы фиксированными слотами (схема скалярная): 5 пар.
 * Дефолты — из эталона wed. Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface ScheduleProps extends Record<string, unknown> {
    title: string;
    t1: string;
    e1: string;
    t2: string;
    e2: string;
    t3: string;
    e3: string;
    t4: string;
    e4: string;
    t5: string;
    e5: string;
}

// Фиксированные слоты пунктов: 5 пар (время + событие). Пустые не рендерятся.
const schema: ParamSchema = [
    {
        group: 'Расписание',
        items: [
            {
                key: 'title',
                label: 'Заголовок',
                type: 'text',
                def: 'Расписание дня',
            },

            { key: 't1', label: 'Пункт 1 — время', type: 'text', def: '15:00' },
            {
                key: 'e1',
                label: 'Пункт 1 — событие',
                type: 'text',
                def: 'Сбор гостей',
            },

            { key: 't2', label: 'Пункт 2 — время', type: 'text', def: '16:00' },
            {
                key: 'e2',
                label: 'Пункт 2 — событие',
                type: 'text',
                def: 'Церемония',
            },

            { key: 't3', label: 'Пункт 3 — время', type: 'text', def: '17:00' },
            {
                key: 'e3',
                label: 'Пункт 3 — событие',
                type: 'text',
                def: 'Банкет',
            },

            { key: 't4', label: 'Пункт 4 — время', type: 'text', def: '21:00' },
            {
                key: 'e4',
                label: 'Пункт 4 — событие',
                type: 'text',
                def: 'Торт',
            },

            { key: 't5', label: 'Пункт 5 — время', type: 'text', def: '23:00' },
            {
                key: 'e5',
                label: 'Пункт 5 — событие',
                type: 'text',
                def: 'Завершение',
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
  display: flex;
  gap: 1rem;
  align-items: baseline;
}
.s-schedule__item + .s-schedule__item {
  margin-top: 1rem;
}
.s-schedule__time {
  font-family: var(--font-display);
  min-width: 4rem;
}
.s-schedule__label {
  font-family: var(--font-body);
  margin: 0;
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
            { n: 1, time: props.t1, label: props.e1 },
            { n: 2, time: props.t2, label: props.e2 },
            { n: 3, time: props.t3, label: props.e3 },
            { n: 4, time: props.t4, label: props.e4 },
            { n: 5, time: props.t5, label: props.e5 },
        ];

        const items = slots
            // пустой слот (время и событие пусты) не рендерится
            .filter((s) => s.time.trim() !== '' || s.label.trim() !== '')
            .map(
                (s) => `
      <li class="s-schedule__item">
        <time class="s-schedule__time" data-prop="t${s.n}">${esc(s.time)}</time>
        <p class="s-schedule__label" data-prop="e${s.n}">${esc(s.label)}</p>
      </li>`,
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

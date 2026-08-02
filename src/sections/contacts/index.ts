/**
 * Секция contacts — текст про организатора, CTA-кнопка и декоративные кольца.
 * Перенос макета Section/Contacts (Figma 287:179): вертикальный поток, pad 32/0,
 * gap 24; deco в потоке (не absolute). Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface ContactsProps extends Record<string, unknown> {
    text: string;
    ctaLabel: string;
    ctaUrl: string;
    decorImg: string;
}

const schema: ParamSchema = [
    {
        group: 'Контакты',
        items: [
            {
                key: 'text',
                label: 'Текст',
                type: 'text',
                def: 'Если у вас возникнут вопросы, или вы готовите нам творческий подарок, обращайтесь к нашему организатору Татьяне',
            },
            {
                key: 'ctaLabel',
                label: 'Подпись кнопки',
                type: 'text',
                def: 'написать Татьяне',
            },
            {
                key: 'ctaUrl',
                label: 'Ссылка кнопки',
                type: 'text',
                def: 'https://t.me/',
            },
            {
                key: 'decorImg',
                label: 'Декор (путь)',
                type: 'text',
                def: '/img/contacts/rings.png',
            },
        ],
    },
];

const css = `
.s-contacts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 0;
  background: var(--color-cream);
  color: var(--color-text);
  text-align: center;
  overflow: hidden;
}
.s-contacts__text {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.25;
  margin: 0;
  max-width: 17.0625rem;
  width: 100%;
}
.s-contacts__cta {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.28;
  color: var(--color-text);
  background: var(--color-accent-soft);
  text-decoration: none;
}
.s-contacts__decor {
  display: block;
  width: 7.5rem;
  max-width: 100%;
  height: auto;
  pointer-events: none;
}
`;

export const contactsModule: BlockModule<ContactsProps> = {
    type: 'contacts',
    label: 'Контакты (организатор)',
    schema,
    defaults: defaultsFromSchema<ContactsProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<ContactsProps>(schema), ...p };

        const text =
            props.text.trim() !== ''
                ? `<p class="s-contacts__text" data-prop="text">${esc(props.text)}</p>`
                : '';

        // Без подписи кнопка не рендерится; без URL остаётся span (inline в редакторе).
        const cta =
            props.ctaLabel.trim() === ''
                ? ''
                : props.ctaUrl.trim() !== ''
                  ? `<a class="s-contacts__cta" href="${esc(props.ctaUrl)}" target="_blank" rel="noopener" data-prop="ctaLabel">${esc(props.ctaLabel)}</a>`
                  : `<span class="s-contacts__cta" data-prop="ctaLabel">${esc(props.ctaLabel)}</span>`;

        // Поворот −3.87° уже в PNG (exportAsync отдаёт повёрнутый bbox) — CSS-rotate не нужен.
        const decor =
            props.decorImg.trim() !== ''
                ? `<img class="s-contacts__decor" src="${esc(props.decorImg)}" alt="" aria-hidden="true" loading="lazy" />`
                : '';

        return `
    <section class="s-contacts">
      ${text}
      ${cta}
      ${decor}
    </section>`;
    },
    css,
};

// Экранирование в т.ч. кавычек: значения подставляются и в атрибуты (src/href),
// где голая кавычка вырвалась бы из значения.
function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

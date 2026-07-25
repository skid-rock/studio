/**
 * Секция dress-code-pearls — перенос макета «4 Dress Code» из Figma (STUDIO-038).
 * Отличие от текстового `dress-code`: палитра — не плоские цветовые swatch'и, а
 * растровые образцы (жемчужины) с подписями, плюс блок контакта с кнопкой и
 * фотокарточка с паспарту и декоративным оверлеем.
 *
 * Схема плоская (в render-core нет массивов и типа «изображение»): образцы —
 * 4 пары ключей `pNimg`/`pNcap`, картинки задаются путём (как `venue.mapImage`).
 * Пустой путь/подпись деградируют — блок просто не рендерится.
 *
 * Отступы взяты из макета и нормализованы к восьмёрочной шкале (30 → 32) —
 * ровно то, что предлагал линт figma-use по исходному фрейму.
 * Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface DressCodePearlsProps extends Record<string, unknown> {
    title: string;
    text: string;
    p1img: string;
    p1cap: string;
    p2img: string;
    p2cap: string;
    p3img: string;
    p3cap: string;
    p4img: string;
    p4cap: string;
    contactText: string;
    ctaLabel: string;
    ctaUrl: string;
    photo: string;
    photoAlt: string;
    decorImg: string;
}

const schema: ParamSchema = [
    {
        group: 'Дресс-код',
        items: [
            { key: 'title', label: 'Заголовок', type: 'text', def: 'ДРЕСС-КОД' },
            {
                key: 'text',
                label: 'Подводка',
                type: 'text',
                def: 'Мы подготовили цветовую палитру, которая поможет поддержать стиль нашего торжества',
            },
        ],
    },
    {
        group: 'Палитра',
        items: [
            {
                key: 'p1img',
                label: 'Образец 1 — картинка',
                type: 'text',
                def: '/img/dress-code/pearl-champagne.png',
            },
            {
                key: 'p1cap',
                label: 'Образец 1 — подпись',
                type: 'text',
                def: 'шампань',
            },
            {
                key: 'p2img',
                label: 'Образец 2 — картинка',
                type: 'text',
                def: '/img/dress-code/pearl-silver.png',
            },
            {
                key: 'p2cap',
                label: 'Образец 2 — подпись',
                type: 'text',
                def: 'серебро',
            },
            {
                key: 'p3img',
                label: 'Образец 3 — картинка',
                type: 'text',
                def: '/img/dress-code/pearl-lavender.png',
            },
            {
                key: 'p3cap',
                label: 'Образец 3 — подпись',
                type: 'text',
                def: 'лаванда',
            },
            {
                key: 'p4img',
                label: 'Образец 4 — картинка',
                type: 'text',
                def: '/img/dress-code/pearl-pistachio.png',
            },
            {
                key: 'p4cap',
                label: 'Образец 4 — подпись',
                type: 'text',
                def: 'фисташка',
            },
        ],
    },
    {
        group: 'Контакт',
        items: [
            {
                key: 'contactText',
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
        ],
    },
    {
        group: 'Фотокарточка',
        items: [
            {
                key: 'photo',
                label: 'Фото (путь)',
                type: 'text',
                def: '/img/dress-code/photo.jpg',
            },
            {
                key: 'photoAlt',
                label: 'Описание фото (alt)',
                type: 'text',
                def: 'Жених и невеста на берегу моря',
            },
            {
                key: 'decorImg',
                label: 'Декор поверх фото (путь)',
                type: 'text',
                def: '/img/dress-code/shell-rings.png',
            },
        ],
    },
];

const css = `
.s-dcp {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: var(--section-pad-y) var(--section-pad-x) 2rem;
  background: var(--color-cream);
  color: var(--color-text);
  text-align: center;
  /* декор свисает за угол фотокарточки — на узких экранах не даём ему
     растянуть страницу по горизонтали */
  overflow: hidden;
}
.s-dcp__head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
.s-dcp__title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 9vw, 2.25rem);
  line-height: 1;
  margin: 0;
}
.s-dcp__lead {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.11;
  margin: 0;
}
/* Палитра — сетка из равных долей, а не строка по содержимому: при разной
   длине подписей кружки остаются равноудалёнными (вывод стресс-теста макета). */
.s-dcp__palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  width: 100%;
  max-width: 17.5rem;
}
.s-dcp__swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.s-dcp__pearl {
  display: block;
  width: 100%;
  max-width: 4rem;
  aspect-ratio: 1;
  height: auto;
}
.s-dcp__caption {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.375;
  margin: 0;
}
.s-dcp__contact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 17.5rem;
}
.s-dcp__contact-text {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 0.95;
  margin: 0;
}
.s-dcp__cta {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.4;
  color: var(--color-text);
  background: var(--color-accent-soft);
  text-decoration: none;
}
/* Паспарту: рамка 12px вокруг фото + мягкая тень (в макете 4.5/-1/3). */
.s-dcp__card {
  position: relative;
  width: 17.5rem;
  max-width: 100%;
  padding: 0.75rem;
  background: var(--color-surface-muted);
  box-shadow: -1px 3px 4.5px rgba(0, 0, 0, 0.25);
}
.s-dcp__photo {
  display: block;
  width: 100%;
  height: auto;
}
/* Единственный элемент вне потока (как и в макете): свисает за правый нижний
   угол карточки. Проценты — чтобы пропорции держались при сужении карточки.
   Поворот −4° уже «запечён» в картинке (Figma отдаёт узел вместе с поворотом,
   размер файла = повёрнутый bbox 120×113), поэтому CSS-поворота тут нет. */
.s-dcp__decor {
  position: absolute;
  right: -11.75%;
  bottom: -8.06%;
  width: 42.8%;
  height: auto;
  pointer-events: none;
}
`;

export const dressCodePearlsModule: BlockModule<DressCodePearlsProps> = {
    type: 'dress-code-pearls',
    label: 'Дресс-код (жемчужины + фото)',
    schema,
    defaults: defaultsFromSchema<DressCodePearlsProps>(schema),
    render: (p) => {
        const props = {
            ...defaultsFromSchema<DressCodePearlsProps>(schema),
            ...p,
        };

        // Образец палитры: рендерим, если задана хоть картинка, хоть подпись.
        // alt пустой — подпись рядом уже несёт смысл (картинка декоративна).
        const swatch = (img: string, cap: string, i: number): string => {
            if (img.trim() === '' && cap.trim() === '') {
                return '';
            }

            const pearl =
                img.trim() !== ''
                    ? `<img class="s-dcp__pearl" src="${esc(img)}" alt="" loading="lazy" />`
                    : '';
            const caption =
                cap.trim() !== ''
                    ? `<p class="s-dcp__caption" data-prop="p${i}cap">${esc(cap)}</p>`
                    : '';

            return `<div class="s-dcp__swatch">${pearl}${caption}</div>`;
        };

        const swatches = [
            swatch(props.p1img, props.p1cap, 1),
            swatch(props.p2img, props.p2cap, 2),
            swatch(props.p3img, props.p3cap, 3),
            swatch(props.p4img, props.p4cap, 4),
        ].join('');

        const palette = swatches
            ? `<div class="s-dcp__palette">${swatches}</div>`
            : '';

        // Кнопка-ссылка: без подписи не рендерится; без URL остаётся текстом
        // (в редакторе подпись правится inline через data-prop).
        const cta =
            props.ctaLabel.trim() === ''
                ? ''
                : props.ctaUrl.trim() !== ''
                  ? `<a class="s-dcp__cta" href="${esc(props.ctaUrl)}" target="_blank" rel="noopener" data-prop="ctaLabel">${esc(props.ctaLabel)}</a>`
                  : `<span class="s-dcp__cta" data-prop="ctaLabel">${esc(props.ctaLabel)}</span>`;

        const contact =
            props.contactText.trim() !== '' || cta
                ? `<div class="s-dcp__contact">
        ${props.contactText.trim() !== '' ? `<p class="s-dcp__contact-text" data-prop="contactText">${esc(props.contactText)}</p>` : ''}
        ${cta}
      </div>`
                : '';

        // Декор — только вместе с фото: он позиционируется относительно карточки.
        const decor =
            props.decorImg.trim() !== ''
                ? `<img class="s-dcp__decor" src="${esc(props.decorImg)}" alt="" aria-hidden="true" loading="lazy" />`
                : '';

        const card =
            props.photo.trim() !== ''
                ? `<div class="s-dcp__card">
        <img class="s-dcp__photo" src="${esc(props.photo)}" alt="${esc(props.photoAlt)}" loading="lazy" />
        ${decor}
      </div>`
                : '';

        return `
    <section class="s-dcp">
      <div class="s-dcp__head">
        <h2 class="s-dcp__title" data-prop="title">${esc(props.title)}</h2>
        <p class="s-dcp__lead" data-prop="text">${esc(props.text)}</p>
      </div>
      ${palette}
      ${contact}
      ${card}
    </section>`;
    },
    css,
};

// Экранирование в т.ч. кавычек: значения подставляются и в атрибуты (src/href/alt),
// где голая кавычка вырвалась бы из значения.
function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Секция dress-code-pearls — дресс-код морского лендинга по узлу Figma
 * `Section/Dress Code Pearls` (32:127), перенос STUDIO-062.
 *
 * От исходного переноса STUDIO-038 осталась только механика палитры: схема плоская
 * (в render-core нет ни массивов, ни типа «изображение»), поэтому образцы — пять пар
 * ключей `pNimg`/`pNcap`, картинки задаются путём (как `venue.mapImage`). Пустой
 * путь/подпись деградируют — образец просто не рендерится.
 *
 * Блок контакта и фотокарточка выпилены: в макете их нет (решение «макет первичен»,
 * STUDIO-058). Вместе с фотокарточкой ушла и захардкоженная тень паспарту.
 *
 * Переносы строк внутри текстов значащие — как в hero, держим `white-space: pre-line`.
 * Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface DressCodePearlsProps extends Record<string, unknown> {
    title: string;
    subtitle: string;
    p1img: string;
    p1cap: string;
    p2img: string;
    p2cap: string;
    p3img: string;
    p3cap: string;
    p4img: string;
    p4cap: string;
    p5img: string;
    p5cap: string;
    womenTitle: string;
    womenText: string;
    menTitle: string;
    menText: string;
}

const schema: ParamSchema = [
    {
        group: 'Дресс-код',
        items: [
            { key: 'title', label: 'Заголовок', type: 'text', def: 'ДРЕСС-КОД' },
            {
                key: 'subtitle',
                label: 'Подводка',
                type: 'text',
                def: 'Мы подготовили цветовую палитру,\nкоторая поможет поддержать стиль нашего торжества',
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
                def: '/img/dress-code/pearl-cream.png',
            },
            {
                key: 'p1cap',
                label: 'Образец 1 — подпись',
                type: 'text',
                def: 'кремовый',
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
                def: '/img/dress-code/pearl-sand.png',
            },
            {
                key: 'p3cap',
                label: 'Образец 3 — подпись',
                type: 'text',
                def: 'песочный',
            },
            {
                key: 'p4img',
                label: 'Образец 4 — картинка',
                type: 'text',
                def: '/img/dress-code/pearl-caramel.png',
            },
            {
                key: 'p4cap',
                label: 'Образец 4 — подпись',
                type: 'text',
                def: 'карамель',
            },
            {
                key: 'p5img',
                label: 'Образец 5 — картинка',
                type: 'text',
                def: '/img/dress-code/pearl-chocolate.png',
            },
            {
                key: 'p5cap',
                label: 'Образец 5 — подпись',
                type: 'text',
                def: 'шоколад',
            },
        ],
    },
    {
        group: 'Что надеть',
        items: [
            {
                key: 'womenTitle',
                label: 'Женщины — заголовок',
                type: 'text',
                def: 'ДЛЯ ЖЕНЩИН',
            },
            {
                key: 'womenText',
                label: 'Женщины — текст',
                type: 'text',
                def: 'коктейльные платья, нарядные блузки, юбки\nукрашения из жемчуга и драгоценных камней\nобувь на удобном каблуке',
            },
            {
                key: 'menTitle',
                label: 'Мужчины — заголовок',
                type: 'text',
                def: 'ДЛЯ МУЖЧИН',
            },
            {
                key: 'menText',
                label: 'Мужчины — текст',
                type: 'text',
                def: 'рубашки, поло, брюки, костюмы\nтуфли или лоферы',
            },
        ],
    },
];

const css = `
.s-dcp {
  background: var(--color-cream);
  color: var(--color-text);
}
/* Ширина и отступы — из макета: фрейм 393 при padding 32, шаг между блоками 32. */
.s-dcp__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 24.5625rem;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
.s-dcp__head {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
.s-dcp__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 400;
  line-height: 1.11;
}
.s-dcp__subtitle {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.28;
  white-space: pre-line;
}
/* Палитра — сетка из равных долей, а не строка по содержимому: при разной длине
   подписей жемчужины остаются равноудалёнными (вывод стресс-теста макета).
   minmax(0, 1fr) — иначе min-width: auto колонки держит ширину подписи
   и на 320 px пятый образец вылезает за край. */
.s-dcp__palette {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
  width: 100%;
}
.s-dcp__swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}
/* В макете жемчужина 48×48. Держим потолок, но даём сжиматься: пять образцов по
   48 + четыре зазора не влезают в вьюпорт уже 320 пикселей. */
.s-dcp__pearl {
  display: block;
  width: 100%;
  max-width: 3rem;
  aspect-ratio: 1;
  height: auto;
}
.s-dcp__caption {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.25;
  max-width: 100%;
  overflow-wrap: break-word;
}
.s-dcp__attire {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}
.s-dcp__group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.s-dcp__group-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.28;
}
.s-dcp__group-text {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.28;
  white-space: pre-line;
}
`;

export const dressCodePearlsModule: BlockModule<DressCodePearlsProps> = {
    type: 'dress-code-pearls',
    label: 'Дресс-код (жемчужины)',
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
            swatch(props.p5img, props.p5cap, 5),
        ].join('');

        const palette = swatches
            ? `<div class="s-dcp__palette">${swatches}</div>`
            : '';

        // Группа блока attire: заголовок и текст правятся inline через data-prop.
        const group = (
            title: string,
            text: string,
            titleKey: string,
            textKey: string,
        ): string => {
            if (title.trim() === '' && text.trim() === '') {
                return '';
            }

            const head =
                title.trim() !== ''
                    ? `<p class="s-dcp__group-title" data-prop="${titleKey}">${esc(title)}</p>`
                    : '';
            const body =
                text.trim() !== ''
                    ? `<p class="s-dcp__group-text" data-prop="${textKey}">${esc(text)}</p>`
                    : '';

            return `<div class="s-dcp__group">${head}${body}</div>`;
        };

        const groups =
            group(props.womenTitle, props.womenText, 'womenTitle', 'womenText') +
            group(props.menTitle, props.menText, 'menTitle', 'menText');

        const attire = groups
            ? `<div class="s-dcp__attire">${groups}</div>`
            : '';

        return `
    <section class="s-dcp">
      <div class="s-dcp__inner">
        <div class="s-dcp__head">
          <h2 class="s-dcp__title" data-prop="title">${esc(props.title)}</h2>
          <p class="s-dcp__subtitle" data-prop="subtitle">${esc(props.subtitle)}</p>
        </div>
        ${palette}
        ${attire}
      </div>
    </section>`;
    },
    css,
};

// Экранирование в т.ч. кавычек: значения подставляются и в атрибуты (src/alt),
// где голая кавычка вырвалась бы из значения.
function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

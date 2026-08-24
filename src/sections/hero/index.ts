/** Hero морского лендинга: фото, имена, приглашение и дата. */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface HeroProps extends Record<string, unknown> {
    photoUrl: string;
    name1: string;
    ampersand: string;
    name2: string;
    eyebrow: string;
    message: string;
    date: string;
}

const schema: ParamSchema = [
    {
        group: 'Hero',
        items: [
            {
                key: 'photoUrl',
                label: 'Фото (URL)',
                type: 'text',
                def: '/img/hero/photo.jpg',
            },
            {
                key: 'name1',
                label: 'Имя 1',
                type: 'text',
                def: 'ДМИТРИЙ',
            },
            {
                key: 'ampersand',
                label: 'Амперсанд',
                type: 'text',
                def: '&',
            },
            {
                key: 'name2',
                label: 'Имя 2',
                type: 'text',
                def: 'МАРИЯ',
            },
            {
                key: 'eyebrow',
                label: 'Надпись',
                type: 'text',
                def: 'ДОРОГИЕ ГОСТИ',
            },
            {
                key: 'message',
                label: 'Текст приглашения',
                type: 'text',
                def: 'Скоро мы станем одной семьей!\nС радостью приглашаем разделить с нами этот важный день',
            },
            { key: 'date', label: 'Дата', type: 'text', def: '27 07 2027' },
        ],
    },
];

const css = `
.s-hero {
  background: var(--color-cream);
  color: var(--color-text);
}
.s-hero__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 24.5625rem;
  margin: 0 auto;
  padding: 2.25rem 2rem;
}
.s-hero__photo {
  box-sizing: border-box;
  width: 100%;
  aspect-ratio: 329 / 504;
  padding: 0.875rem 1rem;
  background: var(--color-cream-alt);
  box-shadow: var(--shadow-photo);
  overflow: hidden;
}
.s-hero__picture {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 2rem 0.625rem;
  overflow: hidden;
}
.s-hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.s-hero__names {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0;
  margin: 0;
}
.s-hero__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 400;
  line-height: 1.1;
  text-align: center;
}
.s-hero__amp {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1.1;
  text-align: center;
}
.s-hero__invite {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.125rem;
  text-align: center;
}
.s-hero__eyebrow {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2.25rem;
  font-weight: 400;
  line-height: 1.1;
}
.s-hero__message {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.25;
  white-space: pre-line;
  text-align: center;
}
.s-hero__date {
  margin: 0;
  font-family: var(--font-numeral);
  font-size: 4rem;
  font-weight: 400;
  line-height: 1.1;
  text-align: center;
}
`;

export const heroModule: BlockModule<HeroProps> = {
    type: 'hero',
    label: 'Hero',
    schema,
    defaults: defaultsFromSchema<HeroProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<HeroProps>(schema), ...p };
        const photo =
            props.photoUrl.trim() !== ''
                ? `<img class="s-hero__img" src="${esc(props.photoUrl)}" alt="" loading="lazy" />`
                : '';

        return `
    <section class="s-hero">
      <div class="s-hero__inner">
        <div class="s-hero__photo">
          <div class="s-hero__picture">
            ${photo}
            <div class="s-hero__names">
              <p class="s-hero__name" data-prop="name1">${esc(props.name1)}</p>
              <p class="s-hero__amp" data-prop="ampersand">${esc(props.ampersand)}</p>
              <p class="s-hero__name" data-prop="name2">${esc(props.name2)}</p>
            </div>
          </div>
        </div>
        <div class="s-hero__invite">
          <p class="s-hero__eyebrow" data-prop="eyebrow">${esc(props.eyebrow)}</p>
          <p class="s-hero__message" data-prop="message">${esc(props.message)}</p>
        </div>
        <p class="s-hero__date" data-prop="date">${esc(props.date)}</p>
      </div>
    </section>`;
    },
    css,
};

function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

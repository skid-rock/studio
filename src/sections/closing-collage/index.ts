/**
 * Closing-collage — финальный коллаж: два фото + монограмма + зашитый декор.
 * Макет Section/Closing Collage (Figma 58:52): всё на холсте `stage` в absolute;
 * фото в props без поворота, углы — CSS transform; deco экспортирован уже
 * повёрнутым (позиции из renderBounds). Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface ClosingCollageProps extends Record<string, unknown> {
    photoLeft: string;
    photoRight: string;
    letterLeft: string;
    amp: string;
    letterRight: string;
}

const schema: ParamSchema = [
    {
        group: 'Closing collage',
        items: [
            {
                key: 'photoLeft',
                label: 'Фото слева',
                type: 'text',
                def: '/img/closing-collage/photo-left.png',
            },
            {
                key: 'photoRight',
                label: 'Фото справа',
                type: 'text',
                def: '/img/closing-collage/photo-right.png',
            },
            {
                key: 'letterLeft',
                label: 'Буква слева',
                type: 'text',
                def: 'Д',
            },
            { key: 'amp', label: 'Амперсанд', type: 'text', def: '&' },
            {
                key: 'letterRight',
                label: 'Буква справа',
                type: 'text',
                def: 'М',
            },
        ],
    },
];

/** Декор зашит в секцию — в редакторе не меняется. */
const DECO = {
    pearlA: '/img/closing-collage/pearl-a.png',
    pearlB: '/img/closing-collage/pearl-b.png',
    pearlC: '/img/closing-collage/pearl-c.png',
    shell: '/img/closing-collage/shell.png',
} as const;

const css = `
.s-cc {
  background: var(--color-cream);
  color: var(--color-text);
  overflow: hidden;
}
.s-cc__stage {
  position: relative;
  width: 100%;
  max-width: 24.5625rem;
  margin: 0 auto;
  aspect-ratio: 393 / 414;
}
.s-cc__photo {
  position: absolute;
  object-fit: cover;
  transform-origin: center center;
  pointer-events: none;
}
.s-cc__photo--left {
  left: 13.49%;
  top: 23.86%;
  width: 38.37%;
  height: 45.48%;
  transform: rotate(11.396deg);
  z-index: 1;
}
.s-cc__photo--right {
  left: 55.73%;
  top: 33.84%;
  width: 33.08%;
  height: 47.1%;
  transform: rotate(-6.878deg);
  z-index: 2;
}
/* deco: поворот уже в PNG — позиции из renderBounds макета */
.s-cc__deco {
  position: absolute;
  display: block;
  pointer-events: none;
}
.s-cc__deco--pearl-a {
  left: 26.59%;
  top: 16.55%;
  width: 7.89%;
  z-index: 3;
}
.s-cc__deco--pearl-b {
  left: 68.42%;
  top: 31.38%;
  width: 7.68%;
  z-index: 4;
}
.s-cc__deco--pearl-c {
  left: 74.81%;
  top: 30.19%;
  width: 3.38%;
  z-index: 5;
}
.s-cc__deco--shell {
  left: 29.44%;
  top: 62.78%;
  width: 33.44%;
  z-index: 6;
}
.s-cc__monogram {
  position: absolute;
  left: 36.13%;
  top: 71.76%;
  width: 12.98%;
  height: 18.12%;
  transform: rotate(23.503deg);
  transform-origin: center center;
  z-index: 7;
  pointer-events: none;
}
.s-cc__letter {
  position: absolute;
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  color: var(--color-text);
  line-height: 1;
  white-space: nowrap;
}
.s-cc__letter--left {
  left: 0;
  top: 0;
  font-size: clamp(1.5rem, 9.16vw, 2.25rem);
}
.s-cc__letter--right {
  left: 58.82%;
  top: 0;
  font-size: clamp(1.5rem, 9.16vw, 2.25rem);
}
.s-cc__letter--amp {
  left: 41.18%;
  top: 38.67%;
  font-size: clamp(0.7rem, 3.82vw, 0.9375rem);
}
`;

export const closingCollageModule: BlockModule<ClosingCollageProps> = {
    type: 'closing-collage',
    label: 'Closing (коллаж)',
    schema,
    defaults: defaultsFromSchema<ClosingCollageProps>(schema),
    render: (p) => {
        const props = {
            ...defaultsFromSchema<ClosingCollageProps>(schema),
            ...p,
        };

        const photoLeft =
            props.photoLeft.trim() !== ''
                ? `<img class="s-cc__photo s-cc__photo--left" src="${esc(props.photoLeft)}" alt="" loading="lazy" />`
                : '';
        const photoRight =
            props.photoRight.trim() !== ''
                ? `<img class="s-cc__photo s-cc__photo--right" src="${esc(props.photoRight)}" alt="" loading="lazy" />`
                : '';

        const letter = (
            key: 'letterLeft' | 'amp' | 'letterRight',
            mod: string,
        ): string =>
            props[key].trim() !== ''
                ? `<span class="s-cc__letter s-cc__letter--${mod}" data-prop="${key}">${esc(props[key])}</span>`
                : '';

        const monogram = `<div class="s-cc__monogram" aria-label="${esc(`${props.letterLeft} ${props.amp} ${props.letterRight}`.trim())}">
        ${letter('letterLeft', 'left')}
        ${letter('amp', 'amp')}
        ${letter('letterRight', 'right')}
      </div>`;

        return `
    <section class="s-cc">
      <div class="s-cc__stage">
        ${photoLeft}
        ${photoRight}
        <img class="s-cc__deco s-cc__deco--pearl-a" src="${DECO.pearlA}" alt="" aria-hidden="true" loading="lazy" />
        <img class="s-cc__deco s-cc__deco--pearl-b" src="${DECO.pearlB}" alt="" aria-hidden="true" loading="lazy" />
        <img class="s-cc__deco s-cc__deco--pearl-c" src="${DECO.pearlC}" alt="" aria-hidden="true" loading="lazy" />
        <img class="s-cc__deco s-cc__deco--shell" src="${DECO.shell}" alt="" aria-hidden="true" loading="lazy" />
        ${monogram}
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

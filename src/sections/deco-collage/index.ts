/**
 * Deco-collage — коллаж: два фото в паспарту + три декоративных элемента.
 * Макет Section/Deco Collage (Figma 58:52): всё на холсте `stage` в absolute;
 * фото в props без поворота, углы — CSS transform; deco экспортирован уже
 * повёрнутым (позиции из bbox макета). Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface DecoCollageProps extends Record<string, unknown> {
    photoLeft: string;
    photoRight: string;
}

const schema: ParamSchema = [
    {
        group: 'Deco collage',
        items: [
            {
                key: 'photoLeft',
                label: 'Фото слева',
                type: 'text',
                def: '/img/deco-collage/photo-left.png',
            },
            {
                key: 'photoRight',
                label: 'Фото справа',
                type: 'text',
                def: '/img/deco-collage/photo-right.png',
            },
        ],
    },
];

/** Декор зашит в секцию — в редакторе не меняется. */
const DECO = {
    pearlA: '/img/deco-collage/pearl-a.png',
    pearlB: '/img/deco-collage/pearl-b.png',
    rings: '/img/deco-collage/rings.png',
} as const;

const css = `
.s-dc {
  background: var(--color-cream);
  color: var(--color-text);
  overflow: hidden;
}
.s-dc__stage {
  position: relative;
  width: 100%;
  max-width: 24.5625rem;
  margin: 0 auto;
  aspect-ratio: 1 / 1;
  box-shadow: var(--shadow-photo);
}
/* паспарту фото: заливка cream-alt + паддинг 8px от stage 393 = 2.04% */
.s-dc__photo {
  position: absolute;
  box-sizing: border-box;
  width: 36.64%;
  height: 52.93%;
  padding: 2.04%;
  background: var(--color-cream-alt);
  box-shadow: var(--shadow-photo);
  transform-origin: center center;
  pointer-events: none;
}
.s-dc__photo--right {
  left: 51.43%;
  top: 21.12%;
  transform: rotate(-7deg);
  z-index: 1;
}
.s-dc__photo--left {
  left: 12.35%;
  top: 5.55%;
  transform: rotate(11deg);
  z-index: 2;
}
.s-dc__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* deco: поворот уже в PNG — позиции из bbox макета */
.s-dc__deco {
  position: absolute;
  display: block;
  pointer-events: none;
}
.s-dc__deco--pearl-a {
  left: 21.63%;
  top: 1.78%;
  width: 7.89%;
  z-index: 3;
}
.s-dc__deco--pearl-b {
  left: 68.19%;
  top: 17.3%;
  width: 7.7%;
  z-index: 4;
}
/*
 * Тень жемчужин — filter, а не box-shadow: жемчужина круглая, а box-shadow
 * рисует тень по прямоугольнику бокса и на экране читается квадратом.
 * drop-shadow идёт по альфе PNG. Цена решения: значения токена --shadow-photo
 * продублированы руками (отдельного токена-фильтра нет).
 */
.s-dc__deco--pearl-a,
.s-dc__deco--pearl-b {
  filter:
    drop-shadow(0 1px 2px rgba(102, 92, 92, 0.25))
    drop-shadow(2px 3px 3px rgba(102, 92, 92, 0.21))
    drop-shadow(4px 6px 4px rgba(102, 92, 92, 0.13))
    drop-shadow(7px 11px 5px rgba(102, 92, 92, 0.04));
}
.s-dc__deco--rings {
  left: 24.17%;
  top: 60.05%;
  width: 30.56%;
  z-index: 5;
}
`;

export const decoCollageModule: BlockModule<DecoCollageProps> = {
    type: 'deco-collage',
    label: 'Deco (коллаж)',
    schema,
    defaults: defaultsFromSchema<DecoCollageProps>(schema),
    render: (p) => {
        const props = {
            ...defaultsFromSchema<DecoCollageProps>(schema),
            ...p,
        };

        // Паспарту рисуем всегда (кремовый прямоугольник с тенью — элемент макета),
        // условна только сама картинка.
        const photo = (key: 'photoLeft' | 'photoRight', mod: string): string => {
            const src = props[key].trim();
            const img =
                src !== ''
                    ? `<img class="s-dc__img" src="${esc(src)}" alt="" loading="lazy" />`
                    : '';

            return `<div class="s-dc__photo s-dc__photo--${mod}">${img}</div>`;
        };

        return `
    <section class="s-dc">
      <div class="s-dc__stage">
        ${photo('photoRight', 'right')}
        ${photo('photoLeft', 'left')}
        <img class="s-dc__deco s-dc__deco--pearl-a" src="${DECO.pearlA}" alt="" aria-hidden="true" loading="lazy" />
        <img class="s-dc__deco s-dc__deco--pearl-b" src="${DECO.pearlB}" alt="" aria-hidden="true" loading="lazy" />
        <img class="s-dc__deco s-dc__deco--rings" src="${DECO.rings}" alt="" aria-hidden="true" loading="lazy" />
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

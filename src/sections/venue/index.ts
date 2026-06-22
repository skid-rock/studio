/**
 * Текстовый блок venue — «когда и где»: место, адрес, дата/время + карта.
 * Карта — статичная картинка-превью (mapImage) + ссылка «открыть в картах»
 * (mapUrl); БЕЗ внешнего рантайма/iframe (ADR-0002, бюджет веса). Если mapImage
 * пуст — секция деградирует до адреса + ссылки. Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface VenueProps extends Record<string, unknown> {
    title: string;
    place: string;
    address: string;
    datetime: string;
    mapImage: string; // путь к скриншоту карты (опц.), напр. /img/map.png
    mapUrl: string; // ссылка на внешнюю карту (Яндекс/Google)
    cta: string; // подпись кнопки-ссылки
}

const schema: ParamSchema = [
    {
        group: 'Когда и где',
        items: [
            {
                key: 'title',
                label: 'Заголовок',
                type: 'text',
                def: 'Когда и где',
            },
            {
                key: 'place',
                label: 'Место',
                type: 'text',
                def: 'Ресторан «Усадьба»',
            },
            {
                key: 'address',
                label: 'Адрес',
                type: 'text',
                def: 'Москва, ул. Пример, 12',
            },
            {
                key: 'datetime',
                label: 'Дата и время',
                type: 'text',
                def: '5 августа 2026, 15:00',
            },
            {
                key: 'mapImage',
                label: 'Картинка карты (путь)',
                type: 'text',
                def: '/img/map.png',
            },
            {
                key: 'mapUrl',
                label: 'Ссылка на карту',
                type: 'text',
                def: 'https://yandex.ru/maps',
            },
            {
                key: 'cta',
                label: 'Подпись кнопки',
                type: 'text',
                def: 'Открыть в картах',
            },
        ],
    },
];

const css = `
.s-venue {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
  text-align: center;
}
.s-venue__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  margin: 0 0 1rem;
}
.s-venue__place {
  font-family: var(--font-display);
  font-size: 1.25rem;
  margin: 0 0 0.25rem;
}
.s-venue__address,
.s-venue__datetime {
  font-family: var(--font-body);
  margin: 0 0 0.25rem;
  opacity: 0.85;
}
.s-venue__map {
  display: block;
  max-width: 36rem;
  width: 100%;
  margin: 1.5rem auto;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-navy);
}
.s-venue__cta {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  color: var(--color-white);
  background: var(--color-navy);
  border-radius: var(--radius-pill);
  text-decoration: none;
}
`;

export const venueModule: BlockModule<VenueProps> = {
    type: 'venue',
    label: 'Когда и где (+ карта)',
    schema,
    defaults: defaultsFromSchema<VenueProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<VenueProps>(schema), ...p };

        // Картинка карты — только если путь задан (иначе деградируем до ссылки).
        // alt берём из place: осмысленная подпись, без data-prop (это атрибут).
        const mapImg =
            props.mapImage.trim() !== ''
                ? `<img class="s-venue__map" src="${esc(props.mapImage)}" alt="Карта: ${esc(props.place)}" loading="lazy" />`
                : '';

        // Ссылка-кнопка во внешние карты. rel=noopener — безопасность target=_blank.
        const cta =
            props.mapUrl.trim() !== ''
                ? `<a class="s-venue__cta" href="${esc(props.mapUrl)}" target="_blank" rel="noopener" data-prop="cta">${esc(props.cta)}</a>`
                : '';

        return `
    <section class="s-venue">
      <h2 class="s-venue__title" data-prop="title">${esc(props.title)}</h2>
      <p class="s-venue__place" data-prop="place">${esc(props.place)}</p>
      <p class="s-venue__address" data-prop="address">${esc(props.address)}</p>
      <p class="s-venue__datetime" data-prop="datetime">${esc(props.datetime)}</p>
      ${mapImg}
      ${cta}
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

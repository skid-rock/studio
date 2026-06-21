/**
 * Описание всех настроек конверта: группы, ползунки, цвета, тексты.
 * Из этой схемы строится панель редактора (Фаза 1) и вычисляются дефолты.
 *
 * Значения по умолчанию = канонический («боевой») конверт, далее перекрываются
 * пресетом из preset.json. Портировано из wed/src/envelope/schema.ts под тип
 * `ParamSchema` из render-core.
 */
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';
import type { EnvelopeState } from './state';
import preset from './preset.json';

export const ENVELOPE_SCHEMA: ParamSchema = [
    {
        group: 'Форма клапанов',
        items: [
            {
                key: 'foldY',
                label: 'Высота схождения',
                min: 30,
                max: 70,
                step: 0.5,
                def: 50,
                unit: '',
            },
            {
                key: 'tipLength',
                label: 'Длина дуги',
                min: 0,
                max: 15,
                step: 0.1,
                def: 1.4,
                unit: '',
            },
            {
                key: 'tipDepth',
                label: 'Глубина дуги',
                min: 0,
                max: 20,
                step: 0.1,
                def: 2.4,
                unit: '',
            },
            {
                key: 'roundDir',
                label: 'Направление',
                min: -1,
                max: 1,
                step: 1,
                def: 1,
                unit: '',
            },
        ],
    },
    {
        group: 'Линии и бумага',
        items: [
            {
                key: 'lineColor',
                label: 'Цвет линии',
                type: 'color',
                def: '#275889',
            },
            {
                key: 'lineWidth',
                label: 'Толщина линии',
                min: 0,
                max: 4,
                step: 0.25,
                def: 1,
                unit: 'px',
            },
            {
                key: 'lineOpacity',
                label: 'Яркость линии',
                min: 0,
                max: 1,
                step: 0.05,
                def: 0.85,
                unit: '',
            },
            {
                key: 'paperColor',
                label: 'Цвет бумаги',
                type: 'color',
                def: '#ffffff',
            },
            {
                key: 'paperAlpha',
                label: 'Плотность бумаги',
                min: 0,
                max: 1,
                step: 0.02,
                def: 0.38,
                unit: '',
            },
            {
                key: 'bgColor',
                label: 'Цвет фона',
                type: 'color',
                def: '#fffaf1',
            },
        ],
    },
    {
        group: 'Печать',
        items: [
            {
                key: 'sealSize',
                label: 'Размер печати',
                min: 60,
                max: 220,
                step: 1,
                def: 140,
                unit: 'px',
            },
            {
                key: 'sealY',
                label: 'Печать по высоте',
                min: 20,
                max: 80,
                step: 1,
                def: 50,
                unit: '%',
            },
            {
                key: 'sealTextY',
                label: 'Текст в печати',
                min: 30,
                max: 70,
                step: 1,
                def: 44,
                unit: '%',
            },
            {
                key: 'sealFont',
                label: 'Шрифт «открыть»',
                min: 0.6,
                max: 2,
                step: 0.05,
                def: 1.05,
                unit: 'rem',
            },
        ],
    },
    {
        group: 'Тексты',
        items: [
            {
                key: 'deliveryY',
                label: '«Вам доставлено» по высоте',
                min: 5,
                max: 45,
                step: 1,
                def: 24,
                unit: '%',
            },
            {
                key: 'deliveryFont',
                label: 'Размер «Вам доставлено»',
                min: 0.8,
                max: 2.4,
                step: 0.05,
                def: 1.2,
                unit: 'rem',
            },
            {
                key: 'initialsY',
                label: '«П & И» по высоте',
                min: 55,
                max: 95,
                step: 1,
                def: 76,
                unit: '%',
            },
            {
                key: 'initialsFont',
                label: 'Размер «П & И»',
                min: 0.8,
                max: 3,
                step: 0.05,
                def: 1.5,
                unit: 'rem',
            },
        ],
    },
    {
        group: 'Раскрытие (анимация)',
        items: [
            {
                key: 'shiftX',
                label: 'Разъезд вбок (эталон 360px)',
                min: 50,
                max: 400,
                step: 10,
                def: 160,
                unit: 'px',
            },
            {
                key: 'shiftXMin',
                label: 'Min разъезд X',
                min: 50,
                max: 300,
                step: 10,
                def: 120,
                unit: 'px',
            },
            {
                key: 'shiftXMax',
                label: 'Max разъезд X',
                min: 100,
                max: 500,
                step: 10,
                def: 220,
                unit: 'px',
            },
            {
                key: 'shiftY',
                label: 'Разъезд ↑↓ (эталон 360px)',
                min: 50,
                max: 600,
                step: 10,
                def: 320,
                unit: 'px',
            },
            {
                key: 'shiftYMin',
                label: 'Min разъезд Y',
                min: 50,
                max: 400,
                step: 10,
                def: 200,
                unit: 'px',
            },
            {
                key: 'shiftYMax',
                label: 'Max разъезд Y',
                min: 150,
                max: 700,
                step: 10,
                def: 320,
                unit: 'px',
            },
        ],
    },
    {
        group: 'Надписи',
        items: [
            {
                key: 'deliveryText',
                label: 'Верхний текст',
                type: 'text',
                def: 'Вам доставлено\nприглашение',
            },
            {
                key: 'initialsText',
                label: 'Инициалы',
                type: 'text',
                def: 'П & И',
            },
            {
                key: 'sealText',
                label: 'Слово в печати',
                type: 'text',
                def: 'открыть',
            },
        ],
    },
];

/**
 * Дефолтное состояние: значения из схемы, перекрытые пресетом (боевой конверт).
 * preset.json может не содержать всех ключей — недостающие берутся из схемы.
 */
export const ENVELOPE_DEFAULTS: EnvelopeState = {
    ...defaultsFromSchema<EnvelopeState>(ENVELOPE_SCHEMA),
    ...(preset as Partial<EnvelopeState>),
};

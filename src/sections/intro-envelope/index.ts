/**
 * Модуль блока `intro/envelope` — конверт-заставка.
 * Первый модуль реестра studio (перенос из wed). Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { EnvelopeState } from './state';
import { ENVELOPE_SCHEMA, ENVELOPE_DEFAULTS } from './schema';
import { renderEnvelopeHtml } from './markup';
import { envelopeCss } from './styles';

export const envelopeModule: BlockModule<EnvelopeState> = {
    type: 'intro/envelope',
    label: 'Конверт-заставка',
    schema: ENVELOPE_SCHEMA,
    defaults: ENVELOPE_DEFAULTS,
    render: (props) => renderEnvelopeHtml({ ...ENVELOPE_DEFAULTS, ...props }),
    css: envelopeCss,
};

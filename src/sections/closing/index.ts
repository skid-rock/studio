/**
 * Минимальный блок closing — подпись и P.S. (демо Фазы 0).
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface ClosingProps extends Record<string, unknown> {
    signature: string;
    ps: string;
}

const schema: ParamSchema = [
    {
        group: 'Closing',
        items: [
            {
                key: 'signature',
                label: 'Подпись',
                type: 'text',
                def: 'С любовью, Полина & Илья',
            },
            {
                key: 'ps',
                label: 'P.S.',
                type: 'text',
                def: 'Будем рады видеть вас!',
            },
        ],
    },
];

const css = `
.s-closing {
  padding: var(--section-pad-y) var(--section-pad-x);
  text-align: center;
  background: var(--color-cream);
  color: var(--color-text);
}
.s-closing__signature {
  font-family: var(--font-script);
  font-size: clamp(1.25rem, 4vw, 2rem);
  margin: 0;
}
.s-closing__ps {
  font-family: var(--font-body);
  font-size: 0.95rem;
  margin: 1.5rem 0 0;
  opacity: 0.85;
}
`;

export const closingModule: BlockModule<ClosingProps> = {
    type: 'closing',
    label: 'Closing (подпись)',
    schema,
    defaults: defaultsFromSchema<ClosingProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<ClosingProps>(schema), ...p };

        return `
    <section class="s-closing">
      <p class="s-closing__signature">${esc(props.signature)}</p>
      <p class="s-closing__ps">P.S. ${esc(props.ps)}</p>
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

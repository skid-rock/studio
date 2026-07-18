import { createElement } from 'react';
import type { ReactElement } from 'react';

import type { StudioDocument } from '../render-core/document';
import type { BlockModule } from '../render-core/types';
import { renderModuleHtml } from './render-block-html';

export interface BlockPreviewProps {
    mod: BlockModule;
    props: Record<string, unknown>;
    doc: StudioDocument;
}

export function BlockPreview({
    mod,
    props,
    doc,
}: BlockPreviewProps): ReactElement {
    const html = renderModuleHtml(mod, props, doc);

    // data-block — для нейтрализации position:fixed конверта в холсте (см. canvas.tsx).
    // data-section-id — адресация узла для inline-правки (STUDIO-015): по нему
    // edit-time слой находит, в какой узел документа писать текст из каретки.
    return createElement('div', {
        className: 'editor-block',
        'data-block': mod.type,
        'data-section-id': props.id as string,
        dangerouslySetInnerHTML: { __html: html },
    });
}

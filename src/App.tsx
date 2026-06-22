import { useMemo } from 'react';

import landingSample from '../examples/landing.sample.json';
import { parseDocument } from './render-core/document.schema';
import { renderDocument } from './render-core/render';
import { defaultRegistry } from './sections/registry.default';
import { themeCssById } from './editor/theme-assets';
import baseCss from './render-core/styles/base.css?raw';
import fontsCss from './render-core/styles/fonts.css?raw';

/**
 * Превью демо-лендинга Фазы 0.
 * React — только оболочка; HTML/CSS собирает агностичный renderDocument.
 */
export function App() {
    const preview = useMemo(() => {
        const doc = parseDocument(landingSample);
        const result = renderDocument(doc, { registry: defaultRegistry });
        const theme = themeCssById(doc.theme.id);
        const css = [baseCss, fontsCss, theme, result.css].join('\n');

        return { body: result.html, css };
    }, []);

    return (
        <>
            <style>{preview.css}</style>
            <div dangerouslySetInnerHTML={{ __html: preview.body }} />
        </>
    );
}

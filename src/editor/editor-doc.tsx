import { createContext, useContext } from 'react';
import type { StudioDocument } from '../render-core/document';

/** Актуальный document.json редактора для RenderContext в BlockPreview. */
export const EditorDocContext = createContext<StudioDocument | null>(null);

export function useEditorDoc(): StudioDocument {
    const doc = useContext(EditorDocContext);

    if (!doc) {
        throw new Error('useEditorDoc: нет EditorDocContext.Provider');
    }

    return doc;
}

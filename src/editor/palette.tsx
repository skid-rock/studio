import type { ReactElement } from 'react';
import { nanoid } from 'nanoid';

import type { EditorStore } from '../editor-core';
import { sortedSections } from '../render-core/document';
import type { StudioDocument } from '../render-core/document';
import type { BlockRegistry } from '../render-core/registry';

export interface PaletteProps {
    store: EditorStore;
    registry: BlockRegistry;
    doc: StudioDocument;
    selectedId: string | null;
}

/** Палитра блоков (STUDIO-033): список модулей реестра, клик — вставка в документ. */
export function Palette({
    store,
    registry,
    doc,
    selectedId,
}: PaletteProps): ReactElement {
    const insert = (type: string): void => {
        // Позиция вставки: после выделенной секции, иначе — в конец документа.
        let index: number | undefined;

        if (selectedId) {
            const i = sortedSections(doc).findIndex((s) => s.id === selectedId);

            if (i !== -1) {
                index = i + 1;
            }
        }

        // id генерируем здесь, чтобы сразу выделить вставленную секцию
        // (props добираются дефолтами блока внутри store.addSection).
        const id = nanoid();
        store.addSection({ type, id }, index);
        store.select(id);
    };

    return (
        <aside className="own-palette">
            <h2 className="own-palette__title">Блоки</h2>
            {registry.list().map((mod) => (
                <button
                    type="button"
                    className="own-block-card"
                    key={mod.type}
                    onClick={() => insert(mod.type)}
                >
                    {mod.label}
                </button>
            ))}
        </aside>
    );
}

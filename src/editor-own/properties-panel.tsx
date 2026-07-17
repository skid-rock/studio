import type { ReactElement } from 'react';

import type { EditorStore } from '../editor-core';
import type { StudioDocument } from '../render-core/document';
import type { BlockRegistry } from '../render-core/registry';
import { SchemaFields } from './schema-fields';

export interface PropertiesPanelProps {
    store: EditorStore;
    registry: BlockRegistry;
    doc: StudioDocument;
    selectedId: string | null;
}

/** Панель свойств (STUDIO-033): форма из ParamSchema блока выделенной секции. */
export function PropertiesPanel({
    store,
    registry,
    doc,
    selectedId,
}: PropertiesPanelProps): ReactElement {
    const section = selectedId
        ? doc.sections.find((s) => s.id === selectedId)
        : undefined;
    const mod = section ? registry.get(section.type) : undefined;

    if (!section || !mod) {
        return (
            <aside className="own-panel">
                <p className="own-panel__empty">Выберите секцию на холсте</p>
            </aside>
        );
    }

    return (
        <aside className="own-panel">
            <div className="own-panel__header">{mod.label}</div>
            {/* key=id: смена выделения пересоздаёт форму под новую секцию; пока
                выделена одна и та же секция, ключ стабилен — фокус не слетает. */}
            <SchemaFields
                key={section.id}
                schema={mod.schema}
                values={section.props}
                onChange={(key, value) =>
                    store.updateProps(section.id, { [key]: value })
                }
            />
        </aside>
    );
}

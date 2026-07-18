import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import {
    PointerSensor,
    PointerActivationConstraints,
} from '@dnd-kit/dom';
import type { Customizable, Sensors } from '@dnd-kit/dom';
import { DragDropProvider } from '@dnd-kit/react';
import { useSortable, isSortable } from '@dnd-kit/react/sortable';

import type { EditorStore } from '../editor-core';
import { sortedSections } from '../render-core/document';
import type { SectionNode, StudioDocument } from '../render-core/document';
import { defaultRegistry } from '../sections/registry.default';
import { BlockPreview } from './block-preview';
import { attachInlineEdit } from './inline-edit';

export interface CanvasProps {
    store: EditorStore;
    doc: StudioDocument;
    selectedId: string | null;
}

// Сенсоры: дефолтные, но Pointer — с порогами активации.
// Тач: задержка, чтобы палец мог скроллить страницу за ручку, не начиная drag.
// Мышь/перо: небольшая дистанция, чтобы клик по ручке не считался перетаскиванием.
const sensors: Customizable<Sensors> = (defaults) => [
    ...defaults.filter((sensor) => sensor !== PointerSensor),
    PointerSensor.configure({
        activationConstraints(event) {
            if (event.pointerType === 'touch') {
                return [
                    new PointerActivationConstraints.Delay({
                        value: 300,
                        tolerance: 8,
                    }),
                ];
            }

            return [new PointerActivationConstraints.Distance({ value: 6 })];
        },
    }),
];

/** Холст: страница из секций, выделение кликом, мини-тулбар, DnD-переупорядочивание. */
export function Canvas({ store, doc, selectedId }: CanvasProps): ReactElement {
    const pageRef = useRef<HTMLDivElement | null>(null);

    // Inline-правка живёт на корне страницы: делегирование событий покрывает все
    // секции, включая добавленные позже (см. inline-edit.ts).
    useEffect(() => {
        const el = pageRef.current;

        if (!el) {
            return;
        }

        return attachInlineEdit(el, store);
    }, [store]);

    const sections = sortedSections(doc);

    return (
        <div className="own-canvas" onClick={() => store.select(null)}>
            <DragDropProvider
                sensors={sensors}
                modifiers={[RestrictToVerticalAxis]}
                onDragEnd={(event) => {
                    // Отмена (Esc) — dnd-kit сам откатывает DOM, документ не трогаем.
                    if (event.canceled) {
                        return;
                    }

                    const { source } = event.operation;

                    if (source && isSortable(source)) {
                        const { initialIndex, index } = source;

                        // Позиция не изменилась — не засорять историю undo пустым шагом.
                        if (initialIndex !== index && typeof source.id === 'string') {
                            // source.index — финальный индекс; совпадает с контрактом
                            // moveSection (индекс в списке без перетаскиваемой секции).
                            store.moveSection(source.id, index);
                        }
                    }
                }}
            >
                <div className="own-page" ref={pageRef}>
                    {sections.length === 0 && (
                        <p className="own-empty">
                            Документ пуст. Добавьте блок из палитры слева.
                        </p>
                    )}
                    {sections.map((node, index) => (
                        <SectionShell
                            key={node.id}
                            node={node}
                            index={index}
                            doc={doc}
                            store={store}
                            isSelected={node.id === selectedId}
                        />
                    ))}
                </div>
            </DragDropProvider>
        </div>
    );
}

interface SectionShellProps {
    node: SectionNode;
    index: number;
    doc: StudioDocument;
    store: EditorStore;
    isSelected: boolean;
}

/** Обёртка секции: выделение, мини-тулбар (drag/дублировать/удалить). */
function SectionShell({
    node,
    index,
    doc,
    store,
    isSelected,
}: SectionShellProps): ReactElement {
    const mod = defaultRegistry.get(node.type);
    const { ref, handleRef, isDragging } = useSortable({
        id: node.id,
        index,
    });

    return (
        <div
            ref={ref}
            className={[
                'own-section',
                isSelected ? 'own-section--selected' : '',
                isDragging ? 'own-section--dragging' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={(e) => {
                e.stopPropagation();
                store.select(node.id);
            }}
        >
            <div className="own-toolbar" onClick={(e) => e.stopPropagation()}>
                <button
                    ref={handleRef}
                    type="button"
                    className="own-tool own-tool--drag"
                    title="Перетащить секцию"
                    aria-label="Перетащить секцию"
                >
                    ⠿
                </button>
                <button
                    type="button"
                    className="own-tool"
                    onClick={() => store.duplicateSection(node.id)}
                    title="Дублировать секцию"
                >
                    ⧉
                </button>
                <button
                    type="button"
                    className="own-tool own-tool--danger"
                    onClick={() => store.removeSection(node.id)}
                    title="Удалить секцию"
                >
                    ✕
                </button>
            </div>
            {mod ? (
                <BlockPreview
                    mod={mod}
                    props={{ ...node.props, id: node.id }}
                    doc={doc}
                />
            ) : (
                <p className="own-unknown">Неизвестный тип секции: {node.type}</p>
            )}
        </div>
    );
}

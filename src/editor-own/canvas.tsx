import { useEffect, useRef, useState } from 'react';
import type { DragEvent, ReactElement } from 'react';

import type { EditorStore } from '../editor-core';
import { sortedSections } from '../render-core/document';
import type { SectionNode, StudioDocument } from '../render-core/document';
import { defaultRegistry } from '../sections/registry.default';
import { BlockPreview } from '../editor/block-preview';
import { attachInlineEdit } from './inline-edit';

export interface CanvasProps {
    store: EditorStore;
    doc: StudioDocument;
    selectedId: string | null;
}

/** Холст: страница из секций, выделение кликом, мини-тулбар, DnD-переупорядочивание. */
export function Canvas({ store, doc, selectedId }: CanvasProps): ReactElement {
    // id перетаскиваемой секции; null — drag не идёт.
    const [dragId, setDragId] = useState<string | null>(null);
    // Индекс промежутка (0..n) под курсором, куда упадёт секция; null — нет цели.
    const [dropGap, setDropGap] = useState<number | null>(null);
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

    const finishDrag = (): void => {
        setDragId(null);
        setDropGap(null);
    };

    const handleDrop = (): void => {
        if (dragId !== null && dropGap !== null) {
            const fromIndex = sections.findIndex((s) => s.id === dragId);
            // toIndex — позиция в списке БЕЗ перетаскиваемой секции (см. moveSection).
            const toIndex = dropGap > fromIndex ? dropGap - 1 : dropGap;

            if (fromIndex !== -1 && toIndex !== fromIndex) {
                store.moveSection(dragId, toIndex);
            }
        }
        finishDrag();
    };

    return (
        <div
            className="own-canvas"
            onClick={() => store.select(null)}
            onDragOver={(e) => {
                if (dragId !== null) {
                    e.preventDefault();
                }
            }}
            onDrop={(e) => {
                e.preventDefault();
                handleDrop();
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
                        isDragging={node.id === dragId}
                        showDropBefore={dropGap === index}
                        showDropAfter={
                            index === sections.length - 1 &&
                            dropGap === sections.length
                        }
                        onDragStartSection={setDragId}
                        onDragEndSection={finishDrag}
                        onDragOverGap={setDropGap}
                    />
                ))}
            </div>
        </div>
    );
}

interface SectionShellProps {
    node: SectionNode;
    index: number;
    doc: StudioDocument;
    store: EditorStore;
    isSelected: boolean;
    isDragging: boolean;
    showDropBefore: boolean;
    showDropAfter: boolean;
    onDragStartSection: (id: string) => void;
    onDragEndSection: () => void;
    onDragOverGap: (gap: number) => void;
}

/** Обёртка секции: выделение, мини-тулбар (drag/дублировать/удалить), drop-цель. */
function SectionShell({
    node,
    index,
    doc,
    store,
    isSelected,
    isDragging,
    showDropBefore,
    showDropAfter,
    onDragStartSection,
    onDragEndSection,
    onDragOverGap,
}: SectionShellProps): ReactElement {
    const mod = defaultRegistry.get(node.type);

    const handleDragStart = (e: DragEvent<HTMLButtonElement>): void => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.id);
        // Ghost — вся секция, а не только ручка.
        const shell = e.currentTarget.closest('.own-section');

        if (shell instanceof HTMLElement) {
            e.dataTransfer.setDragImage(shell, 24, 24);
        }
        // Смена состояния откладывается: синхронная мутация DOM под курсором
        // отменяет drag в Chrome/Safari (известный капкан HTML5 DnD).
        setTimeout(() => onDragStartSection(node.id), 0);
    };

    return (
        <div
            className={[
                'own-section',
                isSelected ? 'own-section--selected' : '',
                isDragging ? 'own-section--dragging' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            data-drop={
                showDropBefore ? 'before' : showDropAfter ? 'after' : undefined
            }
            onClick={(e) => {
                e.stopPropagation();
                store.select(node.id);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                // Верхняя половина секции — промежуток index, нижняя — index + 1.
                const rect = e.currentTarget.getBoundingClientRect();
                const before = e.clientY < rect.top + rect.height / 2;
                onDragOverGap(index + (before ? 0 : 1));
            }}
        >
            <div className="own-toolbar" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="own-tool own-tool--drag"
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={onDragEndSection}
                    title="Перетащить секцию"
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

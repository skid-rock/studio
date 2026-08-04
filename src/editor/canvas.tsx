import { Fragment, useCallback, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import {
    PointerSensor,
    PointerActivationConstraints,
} from '@dnd-kit/dom';
import type { Customizable, Sensors } from '@dnd-kit/dom';
import { DragDropProvider, useDragOperation } from '@dnd-kit/react';
import { useSortable, isSortable } from '@dnd-kit/react/sortable';

import type { EditorStore } from '../editor-core';
import { sortedSections } from '../render-core/document';
import type { SectionNode, StudioDocument } from '../render-core/document';
import { defaultRegistry } from '../sections/registry.default';
import { BlockPreview } from './block-preview';
import { Icon } from './icons';
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
    const detachInline = useRef<(() => void) | null>(null);

    // Inline-правка живёт на корне страницы: делегирование событий покрывает все
    // секции, включая добавленные позже (см. inline-edit.ts). Callback-ref, а не
    // useEffect: при пустом документе .ch-cv-page в разметке нет вовсе, и эффект
    // с зависимостью [store] не переподключился бы после первой добавленной секции.
    const pageRef = useCallback(
        (el: HTMLDivElement | null) => {
            detachInline.current?.();
            detachInline.current = el ? attachInlineEdit(el, store) : null;
        },
        [store],
    );

    const sections = sortedSections(doc);

    return (
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
            {sections.length === 0 ? (
                <div className="ch-cv-empty">
                    Документ пуст. Добавьте блок из палитры слева.
                </div>
            ) : (
                <div className="ch-cv-page" ref={pageRef}>
                    <CanvasSections
                        sections={sections}
                        doc={doc}
                        store={store}
                        selectedId={selectedId}
                    />
                </div>
            )}
        </DragDropProvider>
    );
}

interface CanvasSectionsProps {
    sections: SectionNode[];
    doc: StudioDocument;
    store: EditorStore;
    selectedId: string | null;
}

/**
 * Список секций. Отдельный компонент — потому что useDragOperation работает только
 * внутри DragDropProvider: из него берём id перетаскиваемой секции, чтобы поставить
 * линию места вставки (ch-cv-drop) в её текущий слот.
 */
function CanvasSections({
    sections,
    doc,
    store,
    selectedId,
}: CanvasSectionsProps): ReactElement {
    const { source } = useDragOperation();
    const draggedId = typeof source?.id === 'string' ? source.id : null;

    return (
        <>
            {sections.map((node, index) => (
                <Fragment key={node.id}>
                    {draggedId === node.id && (
                        <div className="ch-cv-drop" aria-hidden="true" />
                    )}
                    <SectionShell
                        node={node}
                        index={index}
                        total={sections.length}
                        doc={doc}
                        store={store}
                        isSelected={node.id === selectedId}
                    />
                </Fragment>
            ))}
        </>
    );
}

interface SectionShellProps {
    node: SectionNode;
    index: number;
    total: number;
    doc: StudioDocument;
    store: EditorStore;
    isSelected: boolean;
}

/** Обёртка секции: выделение, мини-тулбар (drag/выше/ниже/дублировать/удалить). */
function SectionShell({
    node,
    index,
    total,
    doc,
    store,
    isSelected,
}: SectionShellProps): ReactElement {
    const mod = defaultRegistry.get(node.type);
    const [isHovered, setHovered] = useState(false);
    const { ref, handleRef, isDragging } = useSortable({
        id: node.id,
        index,
    });

    // Секция на холсте — контейнер, не кнопка: role="button" схлопнул бы
    // внутренности (контент + мини-тулбар) в одну надпись. Фокус и клавиатура
    // остаются через tabIndex + aria-label; выделение — визуально (класс).
    const sectionLabel = mod
        ? `Секция: ${mod.label}`
        : `Секция: ${node.type}`;

    // Тулбар рендерится, а не прячется стилем: в ДС правила видимости нет, а
    // лишние скрытые ручки в DOM ломали бы строгий режим Playwright.
    const showToolbar = isHovered || isSelected;

    return (
        <div
            ref={ref}
            className={[
                'ch-cv-section',
                'ch-cv-anchor',
                isSelected ? 'is-selected' : '',
                isHovered && !isSelected ? 'is-hover' : '',
                isDragging ? 'ch-cv-ghost' : '',
            ]
                .filter(Boolean)
                .join(' ')}
            tabIndex={0}
            aria-label={sectionLabel}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                store.select(node.id);
            }}
            onKeyDown={(e) => {
                if (e.currentTarget !== e.target) {
                    return;
                }

                if (e.key === 'Enter' || e.key === ' ') {
                    if (e.key === ' ') {
                        e.preventDefault();
                    }
                    store.select(node.id);
                }
            }}
        >
            {showToolbar && (
                <div
                    className="ch-cv-toolbar ch-cv-toolbar--float"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        ref={handleRef}
                        type="button"
                        className="ch-btn ch-btn--icon"
                        style={{ cursor: 'grab' }}
                        title="Перетащить секцию"
                        aria-label="Перетащить секцию"
                    >
                        <Icon name="drag" size={14} />
                    </button>
                    <button
                        type="button"
                        className="ch-btn ch-btn--icon"
                        disabled={index === 0}
                        // moveSection принимает индекс в списке БЕЗ самой секции:
                        // вверх — встать на место соседа сверху.
                        onClick={() => store.moveSection(node.id, index - 1)}
                        title="Выше"
                        aria-label="Выше"
                    >
                        <Icon name="up" size={14} />
                    </button>
                    <button
                        type="button"
                        className="ch-btn ch-btn--icon"
                        disabled={index === total - 1}
                        // Вниз — за соседа снизу: в списке без себя он стоит на
                        // позиции index, значит вставляемся на index + 1.
                        onClick={() => store.moveSection(node.id, index + 1)}
                        title="Ниже"
                        aria-label="Ниже"
                    >
                        <Icon name="down" size={14} />
                    </button>
                    <button
                        type="button"
                        className="ch-btn ch-btn--icon"
                        onClick={() => store.duplicateSection(node.id)}
                        title="Дублировать секцию"
                        aria-label="Дублировать секцию"
                    >
                        <Icon name="duplicate" size={14} />
                    </button>
                    <button
                        type="button"
                        className="ch-btn ch-btn--icon ch-btn--danger"
                        onClick={() => store.removeSection(node.id)}
                        title="Удалить секцию"
                        aria-label="Удалить секцию"
                    >
                        <Icon name="trash" size={14} />
                    </button>
                </div>
            )}
            {mod ? (
                <BlockPreview
                    mod={mod}
                    props={{ ...node.props, id: node.id }}
                    doc={doc}
                />
            ) : (
                // Заглушка по эталону (EditorMvp.dc.html): моноширинный абзац
                // внутри обычной секции, без своего класса.
                <p
                    style={{
                        margin: 0,
                        padding: '32px 48px',
                        font: '400 13px/1.4 var(--chrome-font-mono)',
                        color: 'var(--chrome-muted)',
                    }}
                >
                    Неизвестный тип секции: {node.type}
                </p>
            )}
        </div>
    );
}

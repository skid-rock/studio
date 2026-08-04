import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import {
    PointerSensor,
    PointerActivationConstraints,
} from '@dnd-kit/dom';
import type { Customizable, Sensors } from '@dnd-kit/dom';
import { isKeyboardEvent } from '@dnd-kit/dom/utilities';
import {
    DragDropProvider,
    DragOverlay,
    useDragOperation,
} from '@dnd-kit/react';
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/react';
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

/** Live-порядок секций во время drag (паттерн tracker / TRCK-021). */
interface LiveDrag {
    movedId: string;
    start: string[];
    order: string[];
}

/**
 * Переставить source относительно target по положению указателя.
 * Идемпотентно: без изменений возвращает тот же массив (dragmove частый).
 */
function applySectionDragOver(
    order: string[],
    sourceId: string,
    targetId: string,
    below: boolean,
): string[] {
    if (sourceId === targetId) {
        return order;
    }

    const from = order.indexOf(sourceId);
    const targetIdx = order.indexOf(targetId);

    if (from < 0 || targetIdx < 0) {
        return order;
    }

    const next = order.slice();
    next.splice(from, 1);
    let insertAt = next.indexOf(targetId);

    if (insertAt < 0) {
        return order;
    }

    if (below) {
        insertAt += 1;
    }

    next.splice(insertAt, 0, sourceId);

    if (next.length === order.length && next.every((id, i) => id === order[i])) {
        return order;
    }

    return next;
}

/** Сдвиг на одну позицию вверх/вниз (клавиатурный DnD). */
function moveAdjacent(order: string[], movedId: string, down: boolean): string[] {
    const from = order.indexOf(movedId);

    if (from < 0) {
        return order;
    }

    const to = down
        ? Math.min(from + 1, order.length - 1)
        : Math.max(from - 1, 0);

    if (to === from) {
        return order;
    }

    const next = order.slice();
    next.splice(from, 1);
    next.splice(to, 0, movedId);

    return next;
}

type DragOperationSlice = DragMoveEvent['operation'];

/** Mid-point over текущей цели — для мыши/тача (не для клавиатуры). */
function orderFromPointer(
    order: string[],
    operation: DragOperationSlice,
): string[] {
    const { source, target, position } = operation;

    if (
        !source ||
        !target ||
        !isSortable(source) ||
        !isSortable(target)
    ) {
        return order;
    }

    // shape — у droppable; isSortable сужает тип без поля shape.
    const center = (
        target as typeof target & { shape?: { center?: { y: number } } }
    ).shape?.center;
    const below = center != null ? position.current.y > center.y : true;

    return applySectionDragOver(
        order,
        String(source.id),
        String(target.id),
        below,
    );
}

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
    const byId = useMemo(
        () => new Map(sections.map((node) => [node.id, node])),
        [sections],
    );

    // Live-порядок: state для рендера, ref — для обработчиков dnd-kit (замыкание).
    // OptimisticSortingPlugin отключён у useSortable — двигает DOM в обход React
    // (см. tracker Card.tsx). Расступ делает React через onDragMove: mid-point
    // нужно пересчитывать на каждом движении мыши внутри секции, а не только
    // при смене цели (onDragOver срабатывает редко — вход в чужую секцию).
    const [live, setLive] = useState<LiveDrag | null>(null);
    const liveRef = useRef<LiveDrag | null>(null);
    const updateLive = (value: LiveDrag | null): void => {
        liveRef.current = value;
        setLive(value);
    };

    const orderIds = live?.order ?? sections.map((node) => node.id);

    const handleDragStart = (event: DragStartEvent): void => {
        const { source } = event.operation;

        if (!source || !isSortable(source) || typeof source.id !== 'string') {
            return;
        }

        const ids = sortedSections(store.getState().document).map((s) => s.id);
        updateLive({ movedId: source.id, start: ids, order: ids });
    };

    const handleDragMove = (event: DragMoveEvent): void => {
        const prev = liveRef.current;

        if (!prev) {
            return;
        }

        // Клавиатура: SortableKeyboardPlugin без OptimisticSorting не двигает
        // source.index (индекс контролирует наш React `index`). Один шаг за
        // стрелку — в live-порядке; синтетический move плагина не слушаем.
        if (isKeyboardEvent(event.operation.activatorEvent)) {
            if (!isKeyboardEvent(event.nativeEvent)) {
                return;
            }

            const { by } = event;

            if (!by || by.y === 0) {
                return;
            }

            const next = moveAdjacent(prev.order, prev.movedId, by.y > 0);

            if (next !== prev.order) {
                updateLive({ ...prev, order: next });
            }

            return;
        }

        const next = orderFromPointer(prev.order, event.operation);

        if (next !== prev.order) {
            updateLive({ ...prev, order: next });
        }
    };

    const handleDragEnd = (event: DragEndEvent): void => {
        const session = liveRef.current;
        const { source, activatorEvent } = event.operation;

        // Отмена (Esc) — live сброшен, документ не трогаем.
        if (event.canceled) {
            updateLive(null);

            return;
        }

        let commitTo = -1;

        if (session) {
            if (isKeyboardEvent(activatorEvent)) {
                // Стрелки уже сдвинули live-порядок пошагово.
                commitTo = session.order.indexOf(session.movedId);
            } else {
                // Финальный mid-point: резкий прыжок курсора (Playwright dragTo,
                // флик) может не успеть перестроить порядок через onDragMove —
                // на отпускании позиция и shape уже окончательные.
                const order = orderFromPointer(session.order, event.operation);
                commitTo = order.indexOf(session.movedId);
            }
        }

        updateLive(null);

        if (session) {
            const from = session.start.indexOf(session.movedId);

            if (from !== commitTo && commitTo >= 0) {
                // commitTo — индекс в полном списке с перемещённой секцией;
                // совпадает с контрактом moveSection (индекс вставки без неё).
                store.moveSection(session.movedId, commitTo);
            }

            return;
        }

        // Фолбэк: если live не успел (редко) — индекс из sortable.
        if (source && isSortable(source) && typeof source.id === 'string') {
            const { initialIndex, index } = source;

            if (initialIndex !== index) {
                store.moveSection(source.id, index);
            }
        }
    };

    return (
        <DragDropProvider
            sensors={sensors}
            modifiers={[RestrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
        >
            {sections.length === 0 ? (
                <div className="ch-cv-empty">
                    Документ пуст. Добавьте блок из палитры слева.
                </div>
            ) : (
                <div className="ch-cv-page" ref={pageRef}>
                    <CanvasSections
                        orderIds={orderIds}
                        byId={byId}
                        doc={doc}
                        store={store}
                        selectedId={selectedId}
                        draggedId={live?.movedId ?? null}
                    />
                </div>
            )}
            <DragOverlay>
                {(source) => {
                    const node = byId.get(String(source.id));

                    if (!node) {
                        return null;
                    }

                    return (
                        <SectionOverlay node={node} doc={doc} />
                    );
                }}
            </DragOverlay>
        </DragDropProvider>
    );
}

interface CanvasSectionsProps {
    orderIds: string[];
    byId: Map<string, SectionNode>;
    doc: StudioDocument;
    store: EditorStore;
    selectedId: string | null;
    draggedId: string | null;
}

/**
 * Список секций в live-порядке. Линия ch-cv-drop — в щели перед перетаскиваемой
 * секцией (её текущий слот после onDragMove).
 */
function CanvasSections({
    orderIds,
    byId,
    doc,
    store,
    selectedId,
    draggedId,
}: CanvasSectionsProps): ReactElement {
    // useDragOperation — страховка: если live ещё не выставлен, а drag уже идёт.
    const { source } = useDragOperation();
    const activeId =
        draggedId ?? (typeof source?.id === 'string' ? source.id : null);

    return (
        <>
            {orderIds.map((id, index) => {
                const node = byId.get(id);

                if (!node) {
                    return null;
                }

                return (
                    <Fragment key={node.id}>
                        {activeId === node.id && (
                            <div className="ch-cv-drop" aria-hidden="true" />
                        )}
                        <SectionShell
                            node={node}
                            index={index}
                            total={orderIds.length}
                            doc={doc}
                            store={store}
                            isSelected={node.id === selectedId}
                        />
                    </Fragment>
                );
            })}
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
    // Плагины sortable выключены: OptimisticSorting двигает DOM в обход React;
    // SortableKeyboard без него не обновляет индекс. И мышь, и клавиатура —
    // через live-порядок в React (onDragMove).
    const { ref, handleRef, isDragging } = useSortable({
        id: node.id,
        index,
        plugins: [],
    });

    // Секция на холсте — контейнер, не кнопка: role="button" схлопнул бы
    // внутренности (контент + мини-тулбар) в одну надпись. Фокус и клавиатура
    // остаются через tabIndex + aria-label; выделение — визуально (класс).
    const sectionLabel = mod
        ? `Секция: ${mod.label}`
        : `Секция: ${node.type}`;

    // Тулбар рендерится, а не прячется стилем: в ДС правила видимости нет, а
    // лишние скрытые ручки в DOM ломали бы строгий режим Playwright.
    // Во время drag оставляем тулбар (хотя бы ручку) смонтированным — иначе
    // размонтаж handleRef оборвёт жест.
    const showToolbar = isHovered || isSelected || isDragging;

    return (
        <div
            ref={ref}
            className={[
                'ch-cv-section',
                'ch-cv-anchor',
                isSelected ? 'is-selected' : '',
                isHovered && !isSelected && !isDragging ? 'is-hover' : '',
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
            <SectionBody node={node} doc={doc} mod={mod} />
        </div>
    );
}

interface SectionBodyProps {
    node: SectionNode;
    doc: StudioDocument;
    mod: ReturnType<typeof defaultRegistry.get>;
    /** Overlay: не дублировать id секции в DOM (слот уже с этим id). */
    omitDomId?: boolean;
}

function SectionBody({
    node,
    doc,
    mod,
    omitDomId = false,
}: SectionBodyProps): ReactElement {
    if (mod) {
        return (
            <BlockPreview
                mod={mod}
                props={
                    omitDomId
                        ? { ...node.props }
                        : { ...node.props, id: node.id }
                }
                doc={doc}
            />
        );
    }

    // Заглушка по эталону (EditorMvp.dc.html): моноширинный абзац
    // внутри обычной секции, без своего класса.
    return (
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
    );
}

/** Плавающая копия секции под курсором (DragOverlay) — без тулбара.
 *  Слот в списке остаётся бледным (`ch-cv-ghost`); копия под курсором
 *  непрозрачна, чтобы текст не двоился. */
function SectionOverlay({
    node,
    doc,
}: {
    node: SectionNode;
    doc: StudioDocument;
}): ReactElement {
    const mod = defaultRegistry.get(node.type);

    return (
        <div
            className="ch-cv-section ch-cv-ghost"
            style={{
                width: 'var(--chrome-cv-page)',
                maxWidth: '100%',
                pointerEvents: 'none',
                opacity: 1,
            }}
        >
            <SectionBody
                node={node}
                doc={doc}
                mod={mod}
                omitDomId
            />
        </div>
    );
}

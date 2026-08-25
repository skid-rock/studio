import type { StudioDocument } from '../render-core/document';
import {
    addSection as docAddSection,
    duplicateSection as docDuplicateSection,
    moveSection as docMoveSection,
    removeSection as docRemoveSection,
    setTheme as docSetTheme,
    setThemeOverrides as docSetThemeOverrides,
    updateSectionProps as docUpdateSectionProps,
} from '../render-core/document';
import type { BlockRegistry } from '../render-core/registry';

/** Снимок состояния редактирования: документ (источник правды) + выбранная секция. */
export interface EditorState {
    document: StudioDocument;
    selectedId: string | null;
}

/** Описание вставляемой секции. props опц. — добираются дефолтами блока из реестра. */
export interface NewSection {
    type: string;
    props?: Record<string, unknown>;
    id?: string;
}

/**
 * Публичный порт ядра редактирования — без React/DOM. UI подписывается (subscribe) и
 * шлёт команды; состояние он читает через getState(). Границу «ядро ↛ React/Puck»
 * стережёт ESLint (STUDIO-031, scoped на editor-core).
 */
export interface EditorStore {
    getState(): EditorState;
    subscribe(listener: () => void): () => void;

    select(id: string | null): void;

    addSection(section: NewSection, index?: number): void;
    removeSection(id: string): void;
    moveSection(id: string, toIndex: number): void;
    duplicateSection(id: string): void;
    updateProps(id: string, patch: Record<string, unknown>): void;
    /**
     * Эффективные props секции: переопределения документа поверх defaults модуля.
     * Документ хранит только отличия от дефолта, поэтому «текущее значение поля»
     * из одного `section.props` не прочитать — нужен реестр, а он тут.
     */
    effectiveProps(id: string): Record<string, unknown> | undefined;
    setTheme(themeId: string): void;
    setThemeOverrides(overrides: Record<string, string>): void;
    /** Заменить документ целиком (загрузка из файла). Идёт через историю — откатывается Ctrl+Z. */
    loadDocument(next: StudioDocument): void;

    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
}

/**
 * Создать стор редактирования над StudioDocument. Источник правды — документ; стор
 * добавляет ephemeral-состояние (selection) и историю снимков документа (undo/redo).
 * Команды переиспользуют чистые операции render-core (document.ts) — стор их только
 * оркестрирует (история + оповещение подписчиков).
 */
export function createEditorStore(
    initial: StudioDocument,
    registry: BlockRegistry,
): EditorStore {
    let doc = initial;
    let selectedId: string | null = null;
    let past: StudioDocument[] = [];
    let future: StudioDocument[] = [];
    const listeners = new Set<() => void>();
    // Кэш снапшота состояния: getState() обязан возвращать стабильную ссылку между
    // изменениями (контракт внешних сторов вроде useSyncExternalStore в оболочке).
    let stateCache: EditorState | null = null;

    const emit = (): void => {
        stateCache = null;
        for (const listener of listeners) {
            listener();
        }
    };

    // Сбросить selection, если выбранной секции больше нет в документе.
    const reconcileSelection = (): void => {
        if (
            selectedId !== null &&
            !doc.sections.some((section) => section.id === selectedId)
        ) {
            selectedId = null;
        }
    };

    // Применить транзакцию над документом: старый документ уходит в past (для undo),
    // ветка redo сбрасывается. Если результат тот же объект — ничего не делаем.
    const commit = (next: StudioDocument): void => {
        if (next === doc) {
            return;
        }

        past = [...past, doc];
        future = [];
        doc = next;
        reconcileSelection();
        emit();
    };

    return {
        getState() {
            stateCache ??= { document: doc, selectedId };

            return stateCache;
        },
        subscribe(listener) {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },

        select(id) {
            if (id === selectedId) {
                return;
            }

            selectedId = id;
            emit();
        },

        addSection(section, index) {
            const mod = registry.get(section.type);
            const props = section.props ?? { ...(mod?.defaults ?? {}) };

            commit(
                docAddSection(
                    doc,
                    { type: section.type, props, id: section.id },
                    index,
                ),
            );
        },
        removeSection(id) {
            commit(docRemoveSection(doc, id));
        },
        moveSection(id, toIndex) {
            commit(docMoveSection(doc, id, toIndex));
        },
        duplicateSection(id) {
            commit(docDuplicateSection(doc, id));
        },
        updateProps(id, patch) {
            const section = doc.sections.find((s) => s.id === id);
            const schema = section
                ? registry.get(section.type)?.schema
                : undefined;

            commit(docUpdateSectionProps(doc, id, patch, schema));
        },
        effectiveProps(id) {
            const section = doc.sections.find((s) => s.id === id);

            if (!section) {
                return undefined;
            }

            const mod = registry.get(section.type);

            return { ...(mod?.defaults ?? {}), ...section.props };
        },
        setTheme(themeId) {
            commit(docSetTheme(doc, themeId));
        },
        setThemeOverrides(overrides) {
            commit(docSetThemeOverrides(doc, overrides));
        },
        loadDocument(next) {
            // commit сам сбросит ветку redo и снимет selection, если выбранной
            // секции нет в новом документе (reconcileSelection).
            commit(next);
        },

        undo() {
            if (past.length === 0) {
                return;
            }

            const prev = past[past.length - 1];

            past = past.slice(0, -1);
            future = [doc, ...future];
            doc = prev;
            reconcileSelection();
            emit();
        },
        redo() {
            if (future.length === 0) {
                return;
            }

            const next = future[0];

            future = future.slice(1);
            past = [...past, doc];
            doc = next;
            reconcileSelection();
            emit();
        },
        canUndo() {
            return past.length > 0;
        },
        canRedo() {
            return future.length > 0;
        },
    };
}

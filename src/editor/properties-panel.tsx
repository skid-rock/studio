import { useState } from 'react';
import type { ReactElement } from 'react';

import type { EditorStore } from '../editor-core';
import { sortedSections } from '../render-core/document';
import type { StudioDocument } from '../render-core/document';
import type { BlockRegistry } from '../render-core/registry';
import { PageTab } from './page-controls';
import { resolveShownSection } from './resolve-shown-section';
import { SchemaFields } from './schema-fields';

export interface PropertiesPanelProps {
    store: EditorStore;
    registry: BlockRegistry;
    doc: StudioDocument;
    selectedId: string | null;
}

/**
 * Правая панель (STUDIO-048): вкладки «Секция» / «Страница».
 * Без выделения панель не прячется и не подменяется текстом — она показывает ту же
 * разметку выключенной (требование ДС: интерфейс не перестраивается под курсором).
 */
export function PropertiesPanel({
    store,
    registry,
    doc,
    selectedId,
}: PropertiesPanelProps): ReactElement {
    const [tab, setTab] = useState<'section' | 'page'>('section');
    const list = sortedSections(doc);
    const selected = selectedId
        ? list.find((s) => s.id === selectedId)
        : undefined;

    // «Последняя выделенная» — ephemeral-состояние панели, а не документа: в
    // editor-core ему не место (это память инструмента, STUDIO-048).
    const selectedResolvedId = selected?.id;
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(
        selectedResolvedId ?? null,
    );

    // Подстройка состояния во время рендера — штатный приём React, а не обход
    // линтера. Он безопасен ровно при двух условиях, и оба тут соблюдены: пишем в
    // своё же состояние и под условием (без условия был бы вечный цикл). React
    // сразу перезапускает компонент с новым значением, а недоделанный результат
    // выбрасывает — в DOM он не попадает, лишнего кадра нет.
    // Не переписывать на useEffect: эффект отработает после коммита, и панель один
    // кадр показывала бы прошлую секцию (плюс это ловит react-hooks/set-state-in-
    // effect). Ref вместо состояния — тоже мимо: запись в ref во время рендера
    // нечиста, её ловит react-hooks/refs.
    if (selectedResolvedId && selectedResolvedId !== lastSelectedId) {
        setLastSelectedId(selectedResolvedId);
    }

    const shown = resolveShownSection(list, selectedId, lastSelectedId);
    const mod = shown ? registry.get(shown.type) : undefined;
    const disabled = !selected;

    return (
        <aside className="ch-panel ch-ed-panel">
            <div className="ch-seg ch-seg--fill" role="tablist">
                <button
                    type="button"
                    className={`ch-seg__opt${tab === 'section' ? ' is-active' : ''}`}
                    role="tab"
                    aria-selected={tab === 'section'}
                    onClick={() => setTab('section')}
                >
                    Секция
                </button>
                <button
                    type="button"
                    className={`ch-seg__opt${tab === 'page' ? ' is-active' : ''}`}
                    role="tab"
                    aria-selected={tab === 'page'}
                    onClick={() => setTab('page')}
                >
                    Страница
                </button>
            </div>

            {tab === 'page' ? (
                <PageTab store={store} doc={doc} />
            ) : !shown || !mod ? (
                <>
                    <p className="ch-panel__title">Секция</p>
                    <div className="ch-empty">
                        <span className="ch-empty__title">
                            В документе нет секций
                        </span>
                        <span>
                            Добавьте блок из палитры — панель покажет его поля
                        </span>
                    </div>
                </>
            ) : (
                <>
                    <p className="ch-panel__title">{mod.label}</p>
                    {/* key=id: смена выделения пересоздаёт форму под новую секцию; пока
                        выделена одна и та же секция, ключ стабилен — фокус не слетает. */}
                    <SchemaFields
                        key={shown.id}
                        schema={mod.schema}
                        values={shown.props}
                        disabled={disabled}
                        onChange={(key, value) =>
                            store.updateProps(shown.id, { [key]: value })
                        }
                    />
                    {disabled && (
                        <div className="ch-panel__foot">
                            <p className="ch-panel__hint">
                                Ничего не выделено — панель показывает схему
                                последней выделенной секции. Выберите секцию на
                                холсте, чтобы править её поля.
                            </p>
                        </div>
                    )}
                </>
            )}
        </aside>
    );
}

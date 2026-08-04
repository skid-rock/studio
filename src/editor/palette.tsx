import type { ReactElement } from 'react';
import { nanoid } from 'nanoid';

import type { EditorStore } from '../editor-core';
import { sortedSections } from '../render-core/document';
import type { StudioDocument } from '../render-core/document';
import type { BlockRegistry } from '../render-core/registry';
import { BLOCK_ICON, Icon } from './icons';

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

    // Тип выделенной секции: его карточка в палитре подсвечена как нажатая
    // (эталон editor-mvp — .ch-block-card.is-selected.ch-bleed, STUDIO-051).
    const selectedType = selectedId
        ? (doc.sections.find((s) => s.id === selectedId)?.type ?? null)
        : null;

    return (
        <aside className="ch-panel ch-ed-palette">
            <div className="ch-ident">
                <span className="ch-tile ch-tile--accent">
                    <Icon name="logo" />
                </span>
                <span className="ch-ident__text">
                    <span className="ch-ident__name">studio</span>
                    <span className="ch-ident__sub">свой редактор</span>
                </span>
            </div>
            <hr className="ch-panel__sep" />
            <p className="ch-panel__title">Блоки</p>
            {registry.list().map((mod) => (
                <div
                    key={mod.type}
                    className={
                        mod.type === selectedType
                            ? 'ch-block-card is-selected ch-bleed'
                            : 'ch-block-card'
                    }
                    role="button"
                    tabIndex={0}
                    aria-pressed={mod.type === selectedType}
                    onClick={() => insert(mod.type)}
                    // div, а не button: .ch-block-card не сбрасывает рамку и фон,
                    // которые браузер рисует кнопке. Клавиатуру добираем вручную.
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            insert(mod.type);
                        }
                    }}
                >
                    <span className="ch-tile">
                        <Icon name={BLOCK_ICON[mod.type] ?? 'grid'} />
                    </span>
                    {mod.label}
                </div>
            ))}
        </aside>
    );
}

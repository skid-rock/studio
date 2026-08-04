/**
 * Действия документа во вкладке «Страница»: сохранить / загрузить / экспорт.
 * Загрузка — через скрытый <input type="file">. Слой редактора (React/DOM).
 */
import { useRef } from 'react';

import type { StudioDocument } from '../render-core/document';
import { downloadDocument, readDocumentFile } from './document-io';
import { useToast } from './toast';

interface DocumentActionsProps {
    /** Текущий живой документ для сохранения. */
    getDoc: () => StudioDocument;
    /** Применить загруженный документ (сброс холста). */
    onLoad: (doc: StudioDocument) => void;
    /** Собрать и скачать index.html текущего документа + вернуть отчёт о весе. */
    onExport: () => void;
}

export function DocumentActions({
    getDoc,
    onLoad,
    onExport,
}: DocumentActionsProps) {
    const fileRef = useRef<HTMLInputElement>(null);
    const showToast = useToast();

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ''; // позволить повторно выбрать тот же файл

        if (!file) {
            return;
        }

        try {
            onLoad(await readDocumentFile(file));
        } catch (err) {
            // «Ещё раз» = открыть диалог заново, без запоминания файла (решение Р4).
            showToast({
                text: `Не удалось загрузить документ: ${(err as Error).message}`,
                danger: true,
                actionLabel: 'Ещё раз',
                onAction: () => fileRef.current?.click(),
            });
        }
    }

    return (
        <div className="ch-panel__foot">
            <p className="ch-panel__group">Документ</p>
            <div className="ch-panel__actions">
                <button
                    type="button"
                    className="ch-btn ch-btn--ghost ch-btn--sm"
                    onClick={() => downloadDocument(getDoc())}
                >
                    Сохранить
                </button>
                <button
                    type="button"
                    className="ch-btn ch-btn--ghost ch-btn--sm"
                    onClick={() => fileRef.current?.click()}
                >
                    Загрузить
                </button>
            </div>
            <p className="ch-panel__hint">
                Самостоятельный index.html: картинки и шрифты — ссылками. Вес и бюджет
                придут тостом.
            </p>
            <button
                type="button"
                className="ch-btn ch-btn--primary ch-btn--block"
                onClick={onExport}
            >
                Экспорт HTML
            </button>
            <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleFile}
            />
        </div>
    );
}

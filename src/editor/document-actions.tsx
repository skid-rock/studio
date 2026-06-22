/**
 * Кнопки «Сохранить» / «Загрузить» документа в шапке редактора (Puck headerActions).
 * Загрузка — через скрытый <input type="file">. Слой редактора (React/DOM).
 */
import { useRef } from 'react';

import type { StudioDocument } from '../render-core/document';
import { downloadDocument, readDocumentFile } from './document-io';

interface DocumentActionsProps {
    /** Текущий живой документ для сохранения (docRef из Editor). */
    getDoc: () => StudioDocument;
    /** Применить загруженный документ (сброс холста). */
    onLoad: (doc: StudioDocument) => void;
}

export function DocumentActions({ getDoc, onLoad }: DocumentActionsProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ''; // позволить повторно выбрать тот же файл

        if (!file) {
            return;
        }

        try {
            onLoad(await readDocumentFile(file));
        } catch (err) {
            alert(`Не удалось загрузить документ: ${(err as Error).message}`);
        }
    }

    return (
        <>
            <button type="button" onClick={() => downloadDocument(getDoc())}>
                Сохранить
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
                Загрузить
            </button>
            <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleFile}
            />
        </>
    );
}

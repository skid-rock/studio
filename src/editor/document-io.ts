/**
 * Браузерный ввод/вывод документа: скачать файл, прочитать загруженный файл.
 * Слой редактора — DOM здесь допустим.
 */
import type { StudioDocument } from '../render-core/document';
import { deserializeDocument, serializeDocument } from '../render-core/persist';

const DEFAULT_FILENAME = 'landing.document.json';

/** Скачать документ как JSON-файл. */
export function downloadDocument(
    doc: StudioDocument,
    filename = DEFAULT_FILENAME,
): void {
    const blob = new Blob([serializeDocument(doc)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Прочитать документ из выбранного файла (валидируется). */
export async function readDocumentFile(file: File): Promise<StudioDocument> {
    return deserializeDocument(await file.text());
}

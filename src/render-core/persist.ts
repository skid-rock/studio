/**
 * Персист документа (агностичный слой): сериализация/десериализация StudioDocument.
 * Без DOM/React — работает и в Node (экспорт), и в браузере (редактор).
 * schemaVersion проставляется при сериализации; при чтении документ валидируется
 * и проверяется по версии (parseDocument).
 */
import { CURRENT_SCHEMA_VERSION, type StudioDocument } from './document';
import { parseDocument } from './document.schema';

/** Сериализовать документ в JSON-строку (с актуальной версией схемы). */
export function serializeDocument(doc: StudioDocument): string {
    const withVersion: StudioDocument = {
        ...doc,
        schemaVersion: CURRENT_SCHEMA_VERSION,
    };

    return JSON.stringify(withVersion, null, 2);
}

/** Распарсить JSON-строку в валидный документ. Бросает при невалидном JSON/схеме. */
export function deserializeDocument(json: string): StudioDocument {
    let raw: unknown;

    try {
        raw = JSON.parse(json);
    } catch (err) {
        throw new Error(
            `Невалидный JSON документа: ${(err as Error).message}`,
            {
                cause: err,
            },
        );
    }

    return parseDocument(raw);
}

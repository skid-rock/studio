import { describe, expect, it } from 'vitest';

import landingSample from '../../examples/landing.sample.json';
import { CURRENT_SCHEMA_VERSION, type StudioDocument } from './document';
import { parseDocument } from './document.schema';
import { deserializeDocument, serializeDocument } from './persist';

describe('serializeDocument / deserializeDocument', () => {
    it('round-trip сохраняет документ без потерь', () => {
        const doc = parseDocument(landingSample);
        const restored = deserializeDocument(serializeDocument(doc));

        expect(restored).toEqual(doc);
    });

    it('проставляет актуальную schemaVersion при сериализации', () => {
        const doc: StudioDocument = {
            ...parseDocument(landingSample),
            schemaVersion: 0,
        };
        const json = serializeDocument(doc);
        const parsed = JSON.parse(json) as { schemaVersion: number };

        expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('бросает при невалидном JSON', () => {
        expect(() => deserializeDocument('{ broken')).toThrow(
            /Невалидный JSON документа/,
        );
    });

    it('бросает при неподдерживаемой версии схемы', () => {
        const doc = parseDocument(landingSample);
        const json = JSON.stringify({
            ...doc,
            schemaVersion: CURRENT_SCHEMA_VERSION + 1,
        });

        expect(() => deserializeDocument(json)).toThrow(
            /Неизвестная версия схемы/,
        );
    });
});

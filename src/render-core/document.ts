import { nanoid } from 'nanoid';

import { orderBetween } from './order';

/** Версия схемы документа. Растёт при несовместимых изменениях модели. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Ссылка на тему (id курированного набора токенов) + точечные оверрайды. */
export interface ThemeRef {
    id: string; // напр. "cream-navy"
    overrides?: Record<string, string>; // точечные оверрайды CSS-переменных (опц.)
}

/** Пресет движения (детализируется в Фазе 3). */
export interface MotionConfig {
    preset: string; // напр. "subtle" | "expressive"
}

/** Узел секции лендинга. */
export interface SectionNode {
    id: string; // уникальный стабильный id (nanoid)
    type: string; // ключ в реестре блоков, напр. "intro/envelope", "hero"
    order: string; // дробный индекс порядка (fractional-indexing)
    props: Record<string, unknown>; // параметры секции (валидируются модулем блока)
    children?: SectionNode[]; // вложенность (опционально, большинство секций плоские)
}

/** Корневой документ лендинга — единый источник правды. */
export interface StudioDocument {
    schemaVersion: number;
    theme: ThemeRef;
    motion: MotionConfig;
    sections: SectionNode[];
}

/** Секции в порядке отображения (по возрастанию order). */
export function sortedSections(doc: StudioDocument): SectionNode[] {
    return [...doc.sections].sort((a, b) =>
        a.order < b.order ? -1 : a.order > b.order ? 1 : 0,
    );
}

/** Нормализовать индекс вставки в диапазон [0, length]. */
function clampIndex(index: number, length: number): number {
    if (index < 0) {
        return 0;
    }
    if (index > length) {
        return length;
    }

    return index;
}

/**
 * Вставить секцию на позицию index (0 = в начало; >= длины = в конец).
 * order вычисляется как orderBetween(prev?.order ?? null, next?.order ?? null).
 * id генерируется через nanoid(), если не передан.
 */
export function addSection(
    doc: StudioDocument,
    section: { type: string; props: Record<string, unknown>; id?: string },
    index?: number,
): StudioDocument {
    const list = sortedSections(doc);
    const targetIndex = clampIndex(index ?? list.length, list.length);
    const prev = list[targetIndex - 1] ?? null;
    const next = list[targetIndex] ?? null;
    const order = orderBetween(prev?.order ?? null, next?.order ?? null);

    const node: SectionNode = {
        id: section.id ?? nanoid(),
        type: section.type,
        order,
        props: section.props,
    };

    return { ...doc, sections: [...doc.sections, node] };
}

/** Переместить секцию id на позицию toIndex; пересчитать только её order. */
export function moveSection(
    doc: StudioDocument,
    id: string,
    toIndex: number,
): StudioDocument {
    const list = sortedSections(doc);
    const fromIndex = list.findIndex((section) => section.id === id);

    if (fromIndex === -1) {
        return doc;
    }

    const without = list.filter((section) => section.id !== id);
    const targetIndex = clampIndex(toIndex, without.length);
    const prev = without[targetIndex - 1] ?? null;
    const next = without[targetIndex] ?? null;
    const order = orderBetween(prev?.order ?? null, next?.order ?? null);

    return {
        ...doc,
        sections: doc.sections.map((section) =>
            section.id === id ? { ...section, order } : section,
        ),
    };
}

/** Удалить секцию по id. */
export function removeSection(doc: StudioDocument, id: string): StudioDocument {
    return {
        ...doc,
        sections: doc.sections.filter((section) => section.id !== id),
    };
}

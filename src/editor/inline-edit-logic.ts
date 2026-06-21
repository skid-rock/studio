/**
 * Чистая логика write-back inline-правки (STUDIO-015): без DOM и Puck-сторa.
 */
import type { Data } from '@measured/puck';

/**
 * Обновляет prop узла по sectionId.
 * No-op (пустой объект) — если узел не найден или значение не изменилось.
 */
export function applyInlineEdit(
    prev: Data,
    sectionId: string,
    propKey: string,
    raw: string,
): Partial<Data> {
    const item = prev.content.find(
        (c) => (c.props as { id?: string }).id === sectionId,
    );

    // No-op: значение не изменилось — не плодим запись в истории.
    if (!item || (item.props as Record<string, unknown>)[propKey] === raw) {
        return {};
    }

    return {
        content: prev.content.map((c) =>
            (c.props as { id?: string }).id === sectionId
                ? { ...c, props: { ...c.props, [propKey]: raw } }
                : c,
        ),
    };
}

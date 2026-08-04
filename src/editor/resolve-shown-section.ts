/**
 * Правило выбора схемы панели (STUDIO-048): выделенная → последняя выделенная →
 * первая в документе. Чистая функция — юнит-тестируется без React.
 */
export function resolveShownSection<T extends { id: string }>(
    list: readonly T[],
    selectedId: string | null,
    lastSelectedId: string | null,
): T | undefined {
    const selected = selectedId
        ? list.find((s) => s.id === selectedId)
        : undefined;

    return (
        selected ??
        (lastSelectedId
            ? list.find((s) => s.id === lastSelectedId)
            : undefined) ??
        list[0]
    );
}

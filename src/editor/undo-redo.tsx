/**
 * Кнопки «Отменить»/«Повторить» на встроенной истории Puck (STUDIO-023).
 * История ведётся Puck-ом автоматически на каждое изменение data (правка props,
 * DnD-перестановка, inline-коммит через dispatch setData). back/forward диспатчат
 * setData → onChange → puckToDocument, поэтому StudioDocument остаётся синхронным.
 * Селекторный usePuck: компонент перерисовывается только при смене среза history.
 */
import { createUsePuck } from '@measured/puck';

const usePuck = createUsePuck();

export function UndoRedo() {
    const back = usePuck((s) => s.history.back);
    const forward = usePuck((s) => s.history.forward);
    const hasPast = usePuck((s) => s.history.hasPast);
    const hasFuture = usePuck((s) => s.history.hasFuture);

    return (
        <>
            <button
                type="button"
                onClick={() => back()}
                disabled={!hasPast}
                title="Отменить (Ctrl+Z)"
            >
                Отменить
            </button>
            <button
                type="button"
                onClick={() => forward()}
                disabled={!hasFuture}
                title="Повторить (Ctrl+Shift+Z)"
            >
                Повторить
            </button>
        </>
    );
}

/**
 * Inline-правка текста в своём холсте (STUDIO-034; перенос Puck-моста STUDIO-015).
 *
 * Механика та же, что в src/editor/inline-edit.tsx (ADR-0002, путь «б»), якоря те же:
 * data-prop ставит render секции (STUDIO-014), data-section-id — BlockPreview:
 *   1) MutationObserver включает contentEditable='plaintext-only' на каждом [data-prop];
 *   2) Enter (без Shift) — не перенос строки, а коммит (blur);
 *   3) на blur (focusout) читаем raw textContent и коммитим командой editor-core.
 *
 * Отличия от Puck-версии: нет registerOverlayPortal и пробива pointer-events —
 * в своём холсте нет DnD-обёртки с pointer-events: none; коммит идёт через
 * store.updateProps (документ + история undo) вместо dispatch(setData).
 *
 * Коммит на blur (а не на каждый input): ре-рендер блока идёт через
 * dangerouslySetInnerHTML и сбросил бы каретку; на blur фокуса уже нет.
 */
import type { EditorStore } from '../editor-core';

/** Маркер: якорь уже подготовлен (contentEditable включён). */
const ANCHOR_READY = 'data-inline-edit-ready';

/** Подготовить один якорь: contentEditable без вставки разметки, spellcheck гасим. */
function prepareAnchor(el: HTMLElement): void {
    if (el.hasAttribute(ANCHOR_READY)) {
        return;
    }

    el.setAttribute('contenteditable', 'plaintext-only');
    el.spellcheck = false;
    el.setAttribute(ANCHOR_READY, '');
}

/** Подготовить все непокрытые якоря [data-prop] под root. */
function enableAnchors(root: ParentNode): void {
    if (root instanceof HTMLElement && root.matches('[data-prop]')) {
        prepareAnchor(root);
    }

    root.querySelectorAll<HTMLElement>('[data-prop]').forEach(prepareAnchor);
}

/**
 * Включить inline-правку под root (элемент, содержащий секции с data-section-id).
 * Возвращает cleanup — вызвать при размонтировании холста (return из useEffect).
 */
export function attachInlineEdit(
    root: HTMLElement,
    store: EditorStore,
): () => void {
    // 1) Первичная установка + переустановка на ре-рендерах блоков:
    //    dangerouslySetInnerHTML пересоздаёт поддерево, атрибуты якорей слетают.
    enableAnchors(root);

    const observer = new MutationObserver(() => enableAnchors(root));

    observer.observe(root, { childList: true, subtree: true });

    // 2) Enter в однострочном тексте — не перенос строки, а коммит (blur).
    const onKeyDown = (e: KeyboardEvent): void => {
        const t = e.target as HTMLElement | null;
        const anchor = t?.closest<HTMLElement>('[data-prop]');

        if (anchor && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            anchor.blur();
        }
    };

    // 3) Коммит на blur: raw textContent → команда editor-core → документ + история.
    const onFocusOut = (e: FocusEvent): void => {
        const t = e.target as HTMLElement | null;
        const anchor = t?.closest<HTMLElement>('[data-prop]');

        if (!anchor) {
            return;
        }

        // Снять подсветку ДС; каретку не инжектим — браузерная.
        anchor.classList.remove('ch-inline-edit');

        const host = anchor.closest<HTMLElement>('[data-section-id]');
        const sectionId = host?.dataset.sectionId;
        const propKey = anchor.dataset.prop;

        if (!sectionId || !propKey) {
            return;
        }

        // textContent уже раскодирован браузером — это и есть raw-значение prop
        // (re-esc сделает mod.render при следующем рендере). НЕ un-escape-им вручную.
        const raw = anchor.textContent ?? '';

        // Без изменений — не коммитим: updateSectionProps всегда создаёт новый
        // документ, и каждый blur засорял бы историю undo пустыми шагами.
        const section = store
            .getState()
            .document.sections.find((s) => s.id === sectionId);

        if (!section || section.props[propKey] === raw) {
            return;
        }

        store.updateProps(sectionId, { [propKey]: raw });
    };

    // Подсветка правки по месту: класс ДС на фокусе якоря (каретка — нативная).
    const onFocusIn = (e: FocusEvent): void => {
        const t = e.target as HTMLElement | null;
        const anchor = t?.closest<HTMLElement>('[data-prop]');

        if (anchor && root.contains(anchor)) {
            anchor.classList.add('ch-inline-edit');
        }
    };

    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    return () => {
        observer.disconnect();
        root.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('focusin', onFocusIn);
        root.removeEventListener('focusout', onFocusOut);
    };
}

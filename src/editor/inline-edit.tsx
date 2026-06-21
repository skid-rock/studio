/**
 * Edit-time слой inline-правки текста в холсте (STUDIO-015, путь «б» по ADR-0002).
 *
 * Связь «текст в DOM ↔ prop узла» восстанавливается через якоря: render помечает
 * редактируемые места data-prop (STUDIO-014), обёртка блока — data-section-id
 * (block-preview.tsx). Здесь — edit-time-логика поверх этого:
 *   1) MutationObserver включает contentEditable на каждом [data-prop] в холсте;
 *   2) registerOverlayPortal + pointer-events — клики доходят до якоря сквозь
 *      DnD-обёртку Puck (иначе pointer-events: none на контенте блока);
 *   3) на blur (focusout) с якоря читаем raw textContent и пишем в prop узла Puck
 *      через dispatch(setData) → Puck.onChange → puckToDocument → StudioDocument.
 *
 * Коммит на blur (а не на каждый input): ре-рендер блока идёт через
 * dangerouslySetInnerHTML и сбросил бы каретку; на blur фокуса уже нет.
 *
 * Граница ADR-0001: слой целиком в src/editor/, render-core/sections не трогаются.
 * Монтируется через overrides.puck (Editor.tsx) — там доступен Puck-стор (dispatch).
 */
import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createUsePuck, registerOverlayPortal } from '@measured/puck';
import type { Data } from '@measured/puck';

import { applyInlineEdit } from './inline-edit-logic';

// Селекторный usePuck: подписываемся только на dispatch (стабилен) — мост не
// перерисовывается на каждое изменение состояния редактора.
const usePuck = createUsePuck();

/** Маркер: якорь уже подготовлен (contentEditable + portal). */
const ANCHOR_READY = 'data-inline-edit-ready';

/** Корень превью-холста Puck в текущем документе (iframe выключен в Editor.tsx). */
function previewRoot(): ParentNode {
    return document.querySelector('[data-puck-preview]') ?? document.body;
}

/** Снять portal/cleanup с якоря при удалении из DOM. */
function disposeAnchor(
    el: HTMLElement,
    cleanups: Map<HTMLElement, () => void>,
): void {
    cleanups.get(el)?.();
    cleanups.delete(el);
}

/** Обойти поддерево и снять подготовку с якорей. */
function disposeAnchorsIn(
    root: Node,
    cleanups: Map<HTMLElement, () => void>,
): void {
    if (root instanceof HTMLElement) {
        if (root.matches('[data-prop]')) {
            disposeAnchor(root, cleanups);
        }

        root.querySelectorAll<HTMLElement>('[data-prop]').forEach((el) =>
            disposeAnchor(el, cleanups),
        );
    }
}

/**
 * Подготовить один якорь: contentEditable + пробив pointer-events + portal Puck.
 * Без portal клик перехватывает DnD-обёртка (data-puck-dnd), каретка не появляется.
 */
function prepareAnchor(
    el: HTMLElement,
    cleanups: Map<HTMLElement, () => void>,
): void {
    if (el.hasAttribute(ANCHOR_READY)) {
        return;
    }

    // plaintext-only — без вставки разметки при правке; spellcheck гасим.
    el.setAttribute('contenteditable', 'plaintext-only');
    el.spellcheck = false;
    // Puck ставит pointer-events: none на контент блока — возвращаем на якоре.
    el.style.pointerEvents = 'auto';
    el.setAttribute(ANCHOR_READY, '');

    const cleanup = registerOverlayPortal(el);

    if (cleanup) {
        cleanups.set(el, cleanup);
    }
}

/** Подготовить все непокрытые якоря [data-prop] под root. */
function enableAnchors(
    root: ParentNode,
    cleanups: Map<HTMLElement, () => void>,
): void {
    if (root instanceof HTMLElement && root.matches('[data-prop]')) {
        prepareAnchor(root, cleanups);
    }

    root.querySelectorAll<HTMLElement>('[data-prop]').forEach((el) =>
        prepareAnchor(el, cleanups),
    );
}

export function InlineEditBridge({
    children,
}: {
    children: ReactNode;
}): ReactElement {
    const dispatch = usePuck((s) => s.dispatch);

    useEffect(() => {
        const root = previewRoot();
        const cleanups = new Map<HTMLElement, () => void>();

        const scan = (): void => enableAnchors(root, cleanups);

        // 1) Первичная установка + переустановка на ре-рендерах блоков.
        scan();
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                m.removedNodes.forEach((node) =>
                    disposeAnchorsIn(node, cleanups),
                );
            }

            scan();
        });

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

        // 3) Коммит на blur: raw textContent → prop узла → документ.
        const onFocusOut = (e: FocusEvent): void => {
            const t = e.target as HTMLElement | null;
            const anchor = t?.closest<HTMLElement>('[data-prop]');

            if (!anchor) {
                return;
            }

            const host = anchor.closest<HTMLElement>('[data-section-id]');
            const sectionId = host?.dataset.sectionId;
            const propKey = anchor.dataset.prop;

            if (!sectionId || !propKey) {
                return;
            }

            // textContent уже раскодирован браузером — это и есть raw-значение prop
            // (re-esc сделает mod.render при следующем рендере). НЕ un-escape-им вручную.
            const raw = anchor.textContent ?? '';

            dispatch({
                type: 'setData',
                data: (prev: Data) =>
                    applyInlineEdit(prev, sectionId, propKey, raw),
            });
        };

        const host = root instanceof Element ? root : document;

        host.addEventListener('keydown', onKeyDown as EventListener);
        host.addEventListener('focusout', onFocusOut as EventListener);

        return () => {
            observer.disconnect();
            host.removeEventListener('keydown', onKeyDown as EventListener);
            host.removeEventListener('focusout', onFocusOut as EventListener);
            cleanups.forEach((cleanup) => cleanup());
            cleanups.clear();
        };
    }, [dispatch]);

    return children as ReactElement;
}

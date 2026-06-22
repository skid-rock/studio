/**
 * Edit-time бридж исполнения клиентского JS секций в холсте (STUDIO-019).
 * Контракт «секция с клиентским JS» (addendum ADR-0002): модуль отдаёт статичную
 * строку js (один на тип); здесь — её исполнение в холсте редактора. В проде тот
 * же js доставляет buildPage через <script>. Граница ADR-0001: render-core/sections
 * про редактор не знают; бридж живёт в src/editor/.
 *
 * Реакция на ре-рендер холста — через подписку на appState.data: к моменту этого
 * эффекта (родитель) превью уже перерисовано. Скрипты идемпотентны (см. модуль
 * countdown), повторный прогон безопасен; интервалы открепившихся узлов гаснут сами.
 */
import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createUsePuck } from '@measured/puck';

import { defaultRegistry } from '../sections/registry.default';

const usePuck = createUsePuck();

/** Все клиентские скрипты модулей (дедуп по типу). Каждый безвреден, если его
 *  разметки нет на странице (guard по селектору внутри) — исполняем все скопом. */
function collectModuleJs(): string {
    const seen = new Set<string>();
    const parts: string[] = [];

    for (const mod of defaultRegistry.list()) {
        if (mod.js && !seen.has(mod.type)) {
            seen.add(mod.type);
            parts.push(mod.js);
        }
    }

    return parts.join('\n');
}

const MODULES_JS = collectModuleJs();

/** Корень превью-холста Puck (iframe выключен в Editor.tsx). */
function previewRoot(): Element {
    return document.querySelector('[data-puck-preview]') ?? document.body;
}

/** Исполнить MODULES_JS инъекцией <script> (выполняется синхронно при append). */
function runModuleJs(): void {
    if (!MODULES_JS) {
        return;
    }

    const el = document.createElement('script');

    el.textContent = MODULES_JS;
    previewRoot().appendChild(el);
    el.remove(); // тег больше не нужен — таймеры уже навешаны на узлы countdown
}

export function SectionScriptsBridge({
    children,
}: {
    children: ReactNode;
}): ReactElement {
    // Перерисовка холста идёт при смене данных документа — на неё и реагируем.
    const data = usePuck((s) => s.appState.data);

    useEffect(() => {
        // requestAnimationFrame: дать Puck дорисовать блоки перед прогоном.
        const raf = requestAnimationFrame(runModuleJs);

        return () => cancelAnimationFrame(raf);
    }, [data]);

    return children as ReactElement;
}

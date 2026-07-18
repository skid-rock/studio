/**
 * Live-исполнение клиентского JS секций в своём холсте (STUDIO-035, перенос
 * edit-time бриджа STUDIO-019 с Puck на свой редактор).
 * Контракт «секция с клиентским JS» (addendum ADR-0002): модуль отдаёт статичную
 * строку js (одна на тип); в проде тот же js доставляет buildPage через <script>.
 * Скрипты идемпотентны (см. модуль countdown), повторный прогон безопасен;
 * интервалы открепившихся узлов гаснут сами.
 */
import { defaultRegistry } from '../sections/registry.default';

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

/** Исполнить MODULES_JS над document (скрипты модулей ищут узлы через
 *  document.querySelector*). new Function — и браузер, и happy-dom; инъекция
 *  <script> в happy-dom не исполняет textContent. root.isConnected — холст ещё
 *  в дереве (после unmount прогон не нужен). */
export function runModuleJs(root: Element): void {
    if (!MODULES_JS || !root.isConnected) {
        return;
    }

    new Function(MODULES_JS)();
}

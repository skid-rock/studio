/**
 * Тонкая обвязка над CLI `figma-use` (канал design→code по решению D8).
 *
 * Здесь ровно одна функция: выполнить код в контексте плагина Figma и вернуть
 * строку результата. Никакой абстракции над остальным CLI — команды `node get`,
 * `lint`, `query` вызываются напрямую, оборачивать их незачем.
 *
 * Требует поднятой Figma desktop с `--remote-debugging-port=9222`
 * (флаг учитывается только при холодном старте: Cmd+Q, затем
 * `open -a Figma --args --remote-debugging-port=9222`). Проверка живости —
 * `figma-use status`.
 */
import { execFileSync } from 'node:child_process';

/** Ошибка канала: не завелось подключение или Plugin API вернул исключение. */
export class FigmaUseError extends Error {}

/**
 * Выполняет JS в песочнице плагина и отдаёт напечатанный результат.
 *
 * Код передаётся аргументом процесса (без оболочки), поэтому кавычки и переводы
 * строк внутри скрипта экранировать не нужно — это главная причина существования
 * обвязки: в шелле такие однострочники превращаются в кашу.
 *
 * Внутри скрипта обязателен явный `return` — без него `eval` молча отдаёт пустоту
 * (боль №2 рецепта). Асинхронный код оформляется как `return (async () => { … })()`.
 */
export function evalInFigma(script: string, maxOutputMb = 64): string {
    let stdout: string;

    try {
        stdout = execFileSync('figma-use', ['eval', script], {
            encoding: 'utf8',
            maxBuffer: maxOutputMb * 1024 * 1024,
        });
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        throw new FigmaUseError(
            `не удалось выполнить figma-use eval: ${reason}\n` +
                'Проверь подключение: figma-use status',
        );
    }

    const output = stdout.trim();

    // CLI печатает ошибки Plugin API в stdout с маркером ✗ и нулевым кодом выхода —
    // без этой проверки исключение внутри песочницы выглядит как валидный результат.
    if (output.startsWith('✗')) {
        throw new FigmaUseError(`Figma вернула ошибку:\n${output}`);
    }

    if (output === '') {
        throw new FigmaUseError(
            'пустой ответ от figma-use eval — в скрипте нет явного return ' +
                '(боль №2 рецепта) либо узел не найден',
        );
    }

    return output;
}

/** Разбирает JSON-ответ песочницы, добавляя к ошибке кусок сырого вывода. */
export function evalJson<T>(script: string, maxOutputMb = 64): T {
    const output = evalInFigma(script, maxOutputMb);

    try {
        return JSON.parse(output) as T;
    } catch {
        throw new FigmaUseError(
            `ответ не разобрался как JSON. Первые 200 символов:\n${output.slice(0, 200)}`,
        );
    }
}

/**
 * Тосты редактора (STUDIO-050): один активный тост, автоскрытие + действие.
 * Разметка — ch-toast из ДС (эталон editor-mvp, строки 69–71), своего CSS нет.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

/** Время жизни тоста до автоскрытия. Одно значение на все три сценария. */
const TOAST_TIMEOUT_MS = 8000;

export interface Toast {
    /** Текст сообщения. */
    text: string;
    /** Красный вариант (ch-toast--danger): ошибка или превышение бюджета. */
    danger?: boolean;
    /** Подпись действия справа. */
    actionLabel?: string;
    /** Что делает действие. Тост закрывается до вызова. */
    onAction?: () => void;
}

type ShowToast = (toast: Toast) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** Показать тост из любого места редактора. Новый вытесняет предыдущий. */
export function useToast(): ShowToast {
    const show = useContext(ToastContext);

    if (!show) {
        throw new Error('useToast вызван вне <ToastProvider>');
    }

    return show;
}

export function ToastProvider({
    children,
}: {
    children: ReactNode;
}): ReactElement {
    const [toast, setToast] = useState<Toast | null>(null);
    const timerRef = useRef<number | null>(null);

    // Таймер снимаем при размонтировании: иначе setState после unmount.
    useEffect(
        () => () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        },
        [],
    );

    const hide = (): void => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setToast(null);
    };

    // Очереди нет (решение карточки): новый тост вытесняет старый вместе с
    // его таймером. Значение контекста пересоздаётся каждый рендер — потребителей
    // двое (экспорт и загрузка), мемоизация тут дороже пользы.
    const show: ShowToast = (next) => {
        hide();
        setToast(next);
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            setToast(null);
        }, TOAST_TIMEOUT_MS);
    };

    return (
        <ToastContext.Provider value={show}>
            {children}
            {toast && (
                <div
                    // Порядок классов — как в эталоне: base, danger, float.
                    className={`ch-toast${toast.danger ? ' ch-toast--danger' : ''} ch-toast--float`}
                    // Роль вместо тайминга — по ней тост ищут тесты (риск карточки).
                    role={toast.danger ? 'alert' : 'status'}
                >
                    {toast.text}
                    <button
                        type="button"
                        className="ch-toast__act"
                        onClick={() => {
                            hide();
                            toast.onAction?.();
                        }}
                    >
                        {toast.actionLabel ?? 'Скрыть'}
                    </button>
                </div>
            )}
        </ToastContext.Provider>
    );
}

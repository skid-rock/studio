/**
 * STUDIO-050: ToastProvider — один активный тост, вытеснение, автоскрытие,
 * снятие таймера при размонтировании.
 *
 * @vitest-environment happy-dom
 */
import { createRoot, type Root } from 'react-dom/client';
import { act, type ReactNode } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast, type Toast } from './toast';

// React 19: без флага act(...) пишет warning и события могут не дойти.
beforeAll(() => {
    (
        globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => {
        root.unmount();
    });
    container.remove();
    vi.useRealTimers();
});

/** Кнопка-проба: показывает тост через контекст. */
function Trigger({ label, toast }: { label: string; toast: Toast }) {
    const show = useToast();

    return (
        <button type="button" onClick={() => show(toast)}>
            {label}
        </button>
    );
}

function mount(children: ReactNode): void {
    act(() => {
        root.render(<ToastProvider>{children}</ToastProvider>);
    });
}

function click(label: string): void {
    const btn = [...container.querySelectorAll('button')].find(
        (el) => el.textContent === label,
    );

    expect(btn).toBeTruthy();
    act(() => {
        btn!.click();
    });
}

describe('ToastProvider', () => {
    it('новый тост вытесняет предыдущий — в DOM один', () => {
        mount(
            <>
                <Trigger label="first" toast={{ text: 'первый' }} />
                <Trigger label="second" toast={{ text: 'второй' }} />
            </>,
        );

        click('first');
        expect(container.querySelectorAll('.ch-toast')).toHaveLength(1);
        expect(container.textContent).toContain('первый');

        click('second');
        expect(container.querySelectorAll('.ch-toast')).toHaveLength(1);
        expect(container.textContent).toContain('второй');
        expect(container.textContent).not.toContain('первый');
    });

    it('автоскрытие по таймеру 8 с', () => {
        mount(<Trigger label="show" toast={{ text: 'временный' }} />);

        click('show');
        expect(container.querySelector('.ch-toast')).toBeTruthy();

        act(() => {
            vi.advanceTimersByTime(7999);
        });
        expect(container.querySelector('.ch-toast')).toBeTruthy();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(container.querySelector('.ch-toast')).toBeNull();
    });

    it('размонтирование снимает таймер — setState после unmount не бросает', () => {
        mount(<Trigger label="show" toast={{ text: 'висячий' }} />);
        click('show');
        expect(container.querySelector('.ch-toast')).toBeTruthy();

        act(() => {
            root.unmount();
        });

        expect(() => {
            act(() => {
                vi.advanceTimersByTime(8000);
            });
        }).not.toThrow();
    });

    it('danger → role=alert и класс ch-toast--danger', () => {
        mount(
            <Trigger
                label="err"
                toast={{ text: 'ошибка', danger: true, actionLabel: 'Ещё раз' }}
            />,
        );

        click('err');
        const toast = container.querySelector('.ch-toast');

        expect(toast?.getAttribute('role')).toBe('alert');
        expect(toast?.classList.contains('ch-toast--danger')).toBe(true);
        expect(toast?.textContent).toContain('Ещё раз');
    });
});

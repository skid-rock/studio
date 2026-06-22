/**
 * Шапка редактора (overrides.headerActions) как СТАБИЛЬНЫЙ компонент.
 *
 * Puck читает overrides.headerActions как тип компонента
 * (`CustomHeaderActions = overrides.headerActions`). Inline-стрелка
 * пересоздавалась на каждый ре-рендер Editor → новая ссылка → React ремоунтил
 * шапку, и текстовые поля ThemeOverrides (шрифты) теряли фокус после каждого
 * символа — та же причина, что у puck-оверрайда (см. Editor.tsx, STUDIO-015).
 *
 * Решение по портам/адаптерам: компонент-адаптер HeaderActions со СТАБИЛЬНОЙ
 * ссылкой читает динамику из контекста-порта. Смена данных (тема/оверрайды)
 * теперь ре-рендерит шапку (контекст пробивает memo в обход стабильной ссылки),
 * а НЕ ремоунтит — фокус полей сохраняется.
 */
import { createContext, useContext } from 'react';
import type { ReactElement, ReactNode } from 'react';

import type { StudioDocument } from '../render-core/document';
import { DocumentActions } from './document-actions';
import { ThemeSwitcher } from './theme-switcher';
import { ThemeOverrides } from './theme-overrides';
import { UndoRedo } from './undo-redo';

/**
 * Порт данных/команд шапки. Значение пересоздаётся в Editor на каждый ре-рендер
 * (ссылка меняется — это ОК, ре-рендер фокус не рушит), но ссылка компонента
 * HeaderActions остаётся стабильной — поэтому ремоунта шапки нет.
 */
export interface HeaderActionsValue {
    themeId: string;
    overrides: Record<string, string> | undefined;
    presetCss: string;
    onThemeChange: (id: string) => void;
    onOverrideChange: (key: string, value: string) => void;
    getDoc: () => StudioDocument;
    onLoad: (doc: StudioDocument) => void;
    onExport: () => void;
}

const HeaderActionsContext = createContext<HeaderActionsValue | null>(null);

/** Провайдер порта: оборачивает <Puck>, чтобы HeaderActions (внутри Puck) читал данные. */
export function HeaderActionsProvider({
    value,
    children,
}: {
    value: HeaderActionsValue;
    children: ReactNode;
}): ReactElement {
    return (
        <HeaderActionsContext.Provider value={value}>
            {children}
        </HeaderActionsContext.Provider>
    );
}

/**
 * Стабильная (модульная) ссылка для overrides.headerActions: данные — из контекста,
 * children — дефолтные кнопки шапки Puck. Передаётся в Puck по идентичности,
 * поэтому шапка ре-рендерится, а не ремоунтится.
 */
export function HeaderActions({
    children,
}: {
    children?: ReactNode;
}): ReactElement {
    const v = useContext(HeaderActionsContext);

    // Без провайдера UI шапки бессмысленен, но render не роняем (инвариант студии).
    if (!v) {
        return <>{children}</>;
    }

    return (
        <>
            <UndoRedo />
            <ThemeSwitcher value={v.themeId} onChange={v.onThemeChange} />
            <ThemeOverrides
                value={v.overrides}
                presetCss={v.presetCss}
                onChange={v.onOverrideChange}
            />
            <DocumentActions
                getDoc={v.getDoc}
                onLoad={v.onLoad}
                onExport={v.onExport}
            />
            {children}
        </>
    );
}

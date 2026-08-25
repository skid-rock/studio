/**
 * Иконки хрома — inline-SVG Lucide, скопированные из эталона ДС
 * (docs/design/templates/editor-mvp/EditorMvp.dc.html).
 * Контракт эталона: viewBox 24, stroke-width 1.75, currentColor,
 * 16px в хроме и 14px в мини-тулбаре секции.
 */
import type { ReactElement, ReactNode } from 'react';

export type IconName =
    | 'logo'
    | 'undo'
    | 'redo'
    | 'drag'
    | 'up'
    | 'down'
    | 'duplicate'
    | 'trash'
    | 'envelope'
    | 'heart'
    | 'timeline'
    | 'list'
    | 'clock'
    | 'pin'
    | 'palette'
    | 'image'
    | 'help'
    | 'phone'
    | 'clipboard'
    | 'pencil'
    | 'grid'
    | 'chevron-down'
    | 'chevron-right';

const PATHS: Record<IconName, ReactNode> = {
    // ── хром ──────────────────────────────────────────────────────────────
    logo: (
        <>
            <path d="m12 3 9 5-9 5-9-5 9-5" />
            <path d="m3 12 9 5 9-5" />
        </>
    ),
    undo: (
        <>
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
        </>
    ),
    redo: (
        <>
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0 0 10h4" />
        </>
    ),
    drag: (
        <>
            <circle cx="9" cy="6" r="1" />
            <circle cx="15" cy="6" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="9" cy="18" r="1" />
            <circle cx="15" cy="18" r="1" />
        </>
    ),
    up: (
        <>
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
        </>
    ),
    down: (
        <>
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </>
    ),
    duplicate: (
        <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </>
    ),
    trash: (
        <>
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
        </>
    ),
    // ── тайлы блоков ──────────────────────────────────────────────────────
    envelope: (
        <>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m2 7 10 6 10-6" />
        </>
    ),
    heart: <path d="M12 20s-7-4.6-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.4-7 9-7 9Z" />,
    timeline: (
        <>
            <path d="M12 3v18" />
            <circle cx="12" cy="7" r="2" />
            <circle cx="12" cy="17" r="2" />
        </>
    ),
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    clock: (
        <>
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2M9 2h6" />
        </>
    ),
    pin: (
        <>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </>
    ),
    palette: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="9" r="1" />
            <circle cx="15" cy="9" r="1" />
            <circle cx="9.5" cy="15" r="1" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3 2.4V14" />
            <path d="M12 17.2v.1" />
        </>
    ),
    phone: (
        <path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.1 9.3a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.2Z" />
    ),
    clipboard: (
        <>
            <rect x="8" y="3" width="8" height="4" rx="1" />
            <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
        </>
    ),
    pencil: (
        <>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
    ),
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
    ),
    // ── раскрывашки панели (STUDIO-048) ───────────────────────────────────
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-right': <path d="m9 6 6 6-6 6" />,
};

export interface IconProps {
    name: IconName;
    /** 16 — хром (умолчание), 14 — мини-тулбар секции (STUDIO-049). */
    size?: 14 | 16;
}

/** Иконка декоративна: смысл несёт aria-label кнопки (STUDIO-045). */
export function Icon({ name, size = 16 }: IconProps): ReactElement {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {PATHS[name]}
        </svg>
    );
}

/**
 * Тайл по типу секции. Ключи — mod.type из реестра; порядок совпадает с
 * порядком карточек в эталоне. Неизвестный тип падает на 'grid'.
 */
export const BLOCK_ICON: Record<string, IconName> = {
    'intro/envelope': 'envelope',
    hero: 'heart',
    'our-story': 'timeline',
    schedule: 'list',
    countdown: 'clock',
    venue: 'pin',
    'dress-code': 'palette',
    'dress-code-pearls': 'image',
    'details-faq': 'help',
    contacts: 'phone',
    rsvp: 'clipboard',
    closing: 'pencil',
    'deco-collage': 'grid',
};

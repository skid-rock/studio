/**
 * Точечные оверрайды ключевых токенов темы (STUDIO-022, вёрстка — STUDIO-048).
 * Пишет в ThemeRef.overrides; пустое значение — снять оверрайд (вернуть пресет).
 * Слой редактора (React/DOM). Список токенов курируемый — не «любой токен».
 */
import { useState } from 'react';

import { resolveCssVar } from '../tokens/themes';
import { Icon } from './icons';

interface ThemeOverridesProps {
    /** Текущие оверрайды документа (ThemeRef.overrides). */
    value: Record<string, string> | undefined;
    /** CSS активного пресета (без оверрайдов) — источник дефолтов свотча. */
    presetCss: string;
    /** Применить новое значение токена ('' — снять оверрайд). */
    onChange: (key: string, value: string) => void;
}

/** Редактируемые токены: подпись + тип контрола. */
const COLOR_TOKENS: { key: string; label: string }[] = [
    { key: '--color-navy', label: 'Основной' },
    { key: '--color-terracotta', label: 'Акцент' },
    { key: '--color-cream', label: 'Фон' },
    { key: '--color-text', label: 'Текст' },
];
const FONT_TOKENS: { key: string; label: string }[] = [
    { key: '--font-display', label: 'Заголовки' },
    { key: '--font-body', label: 'Текст' },
];

export function ThemeOverrides({
    value,
    presetCss,
    onChange,
}: ThemeOverridesProps) {
    const [open, setOpen] = useState(true);
    const get = (k: string): string => value?.[k] ?? '';
    // Значение токена из активного пресета (для дефолта свотча/плейсхолдера).
    const preset = (k: string): string => resolveCssVar(presetCss, k) ?? '';

    /** Свотч + hex одного токена. Цвет свотча — инлайновым background (см. карточку). */
    const swatch = (t: { key: string; label: string }) => {
        const shown = get(t.key) || preset(t.key) || '#000000';

        return (
            <div className="ch-color-field">
                <input
                    className="ch-color-field__swatch"
                    type="color"
                    // input type=color требует #rrggbb; без оверрайда показываем
                    // текущий цвет пресета (а не чёрный), но в документ его не пишем.
                    value={shown}
                    style={{ background: shown }}
                    aria-label={t.label}
                    onChange={(e) => onChange(t.key, e.target.value)}
                />
                <input
                    className="ch-color-field__value"
                    type="text"
                    spellCheck={false}
                    value={shown}
                    aria-label={`${t.label} — hex`}
                    onChange={(e) => {
                        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                            onChange(t.key, e.target.value);
                        }
                    }}
                />
            </div>
        );
    };

    return (
        <>
            <button
                type="button"
                className="ch-panel__section"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <span className="ch-tile">
                    <Icon name="palette" />
                </span>
                Палитра и шрифты
                <span className="ch-panel__section__chev">
                    <Icon name={open ? 'chevron-down' : 'chevron-right'} />
                </span>
            </button>
            {open && (
                <div className="ch-panel__section-body">
                    {COLOR_TOKENS.map((t) =>
                        get(t.key) ? (
                            // Переопределён — поле уходит в стопку, рядом «Сброс»
                            // (в строке 148px hex и кнопка не помещаются).
                            <div className="ch-field" key={t.key}>
                                <span className="ch-field__label">{t.label}</span>
                                <div className="ch-field__pair">
                                    {swatch(t)}
                                    <button
                                        type="button"
                                        className="ch-btn ch-btn--ghost"
                                        onClick={() => onChange(t.key, '')}
                                    >
                                        Сброс
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="ch-field ch-field--row" key={t.key}>
                                <span className="ch-field__label">{t.label}</span>
                                {swatch(t)}
                            </div>
                        ),
                    )}
                    {FONT_TOKENS.map((t) => (
                        <div className="ch-field ch-field--row" key={t.key}>
                            {/* id без префикса ch-: по readme ДС префикс
                                закреплён за классами хрома, а на id он ломает
                                статическое снятие классов в ds:contract
                                (STUDIO-051). */}
                            <label
                                className="ch-field__label"
                                htmlFor={`font-${t.key.slice(2)}`}
                            >
                                {t.label}
                            </label>
                            <input
                                className="ch-input"
                                id={`font-${t.key.slice(2)}`}
                                type="text"
                                // плейсхолдер — текущий шрифт пресета, чтобы был виден дефолт.
                                placeholder={preset(t.key) || 'напр. Georgia, serif'}
                                value={get(t.key)}
                                onChange={(e) =>
                                    onChange(t.key, e.target.value)
                                }
                            />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

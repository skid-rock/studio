/**
 * Точечные оверрайды ключевых токенов темы (STUDIO-022).
 * Пишет в ThemeRef.overrides; пустое значение — снять оверрайд (вернуть пресет).
 * Слой редактора (React/DOM). Список токенов курируемый — не «любой токен».
 */
import { resolveCssVar } from '../tokens/themes';

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
    const get = (k: string): string => value?.[k] ?? '';
    // Значение токена из активного пресета (для дефолта свотча/плейсхолдера).
    const preset = (k: string): string => resolveCssVar(presetCss, k) ?? '';

    return (
        <details>
            <summary>Палитра/шрифты</summary>
            {COLOR_TOKENS.map((t) => (
                <label key={t.key} style={{ display: 'block' }}>
                    {t.label}
                    <input
                        type="color"
                        // input type=color требует #rrggbb; без оверрайда показываем
                        // текущий цвет пресета (а не чёрный), но в документ его не пишем.
                        value={get(t.key) || preset(t.key) || '#000000'}
                        onChange={(e) => onChange(t.key, e.target.value)}
                    />
                    {get(t.key) && (
                        <button
                            type="button"
                            onClick={() => onChange(t.key, '')}
                        >
                            сброс
                        </button>
                    )}
                </label>
            ))}
            {FONT_TOKENS.map((t) => (
                <label key={t.key} style={{ display: 'block' }}>
                    {t.label}
                    <input
                        type="text"
                        // плейсхолдер — текущий шрифт пресета, чтобы было видно дефолт.
                        placeholder={preset(t.key) || 'напр. Georgia, serif'}
                        value={get(t.key)}
                        onChange={(e) => onChange(t.key, e.target.value)}
                    />
                </label>
            ))}
        </details>
    );
}

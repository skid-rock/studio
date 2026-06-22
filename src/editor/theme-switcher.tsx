/** Выпадающий выбор темы в шапке редактора. Меняет ThemeRef.id документа. */
import { THEMES, type ThemePreset } from './theme-assets';

interface ThemeSwitcherProps {
    value: string;
    onChange: (id: string) => void;
}

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
    return (
        <select
            aria-label="Тема"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {THEMES.map((t: ThemePreset) => (
                <option key={t.id} value={t.id}>
                    {t.name}
                </option>
            ))}
        </select>
    );
}

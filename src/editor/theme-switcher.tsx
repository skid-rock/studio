/** Выбор темы во вкладке «Страница» правой панели. Меняет ThemeRef.id документа. */
import { THEMES, type ThemePreset } from './theme-assets';

interface ThemeSwitcherProps {
    value: string;
    onChange: (id: string) => void;
}

export function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
    return (
        <div className="ch-field ch-field--row">
            {/* id без префикса ch-: по readme ДС префикс закреплён за классами
                хрома, а на id он ломает статическое снятие классов в
                ds:contract (STUDIO-051). */}
            <label className="ch-field__label" htmlFor="page-theme">
                Тема
            </label>
            <select
                className="ch-select"
                id="page-theme"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {THEMES.map((t: ThemePreset) => (
                    <option key={t.id} value={t.id}>
                        {t.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Минимальный блок hero — имена и дата (демо Фазы 0).
 */
import type { BlockModule } from "../../render-core/types";
import type { ParamSchema } from "../../render-core/schema";
import { defaultsFromSchema } from "../../render-core/schema";

interface HeroProps extends Record<string, unknown> {
  names: string;
  date: string;
  eyebrow: string;
}

const schema: ParamSchema = [
  {
    group: "Hero",
    items: [
      { key: "eyebrow", label: "Надпись сверху", type: "text", def: "Мы женимся" },
      { key: "names", label: "Имена", type: "text", def: "Полина & Илья" },
      { key: "date", label: "Дата", type: "text", def: "05.08.2026" },
    ],
  },
];

const css = `
.s-hero {
  padding: var(--section-pad-y) var(--section-pad-x);
  text-align: center;
  background: var(--color-cream);
  color: var(--color-text);
}
.s-hero__names {
  font-family: var(--font-display);
  font-size: clamp(2rem, 8vw, 3.5rem);
  margin: 0;
}
.s-hero__eyebrow {
  font-family: var(--font-body);
  letter-spacing: 0.1em;
  text-transform: lowercase;
  margin: 0 0 0.5rem;
}
.s-hero__date {
  font-family: var(--font-display);
  margin: 1rem 0 0;
}
`;

export const heroModule: BlockModule<HeroProps> = {
  type: "hero",
  label: "Hero (имена и дата)",
  schema,
  defaults: defaultsFromSchema<HeroProps>(schema),
  render: (p) => {
    const props = { ...defaultsFromSchema<HeroProps>(schema), ...p };
    return `
    <section class="s-hero">
      <p class="s-hero__eyebrow">${esc(props.eyebrow)}</p>
      <h1 class="s-hero__names">${esc(props.names)}</h1>
      <p class="s-hero__date">${esc(props.date)}</p>
    </section>`;
  },
  css,
};

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

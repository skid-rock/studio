import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { loadThemeCss, resolveThemeCss, themeCssPath } from "./theme";

const DIST_CSS = join(dirname(fileURLToPath(import.meta.url)), "dist", "cream-navy.css");

/** Ключевые переменные темы cream-navy (сверка с wed/src/styles/tokens.css). */
const EXPECTED_VARS = [
  "--color-cream:",
  "--color-navy:",
  "--color-text: var(--color-navy)",
  "--font-display:",
  "--font-body:",
  "--radius-md:",
  "--section-pad-y:",
  "--ease-out:",
  "--duration-reveal:",
] as const;

describe("tokens/dist/cream-navy.css", () => {
  it("существует и содержит :root с ключевыми CSS-переменными", () => {
    const css = readFileSync(DIST_CSS, "utf8");

    expect(css).toContain(":root {");
    for (const needle of EXPECTED_VARS) {
      expect(css).toContain(needle);
    }
  });

  it("не содержит envelope/slot — они вне темы", () => {
    const css = readFileSync(DIST_CSS, "utf8");

    expect(css).not.toContain("--envelope-");
    expect(css).not.toContain("--slot-");
  });
});

describe("loadThemeCss", () => {
  it("загружает cream-navy по id", () => {
    const css = loadThemeCss("cream-navy");

    expect(css).toContain("--color-navy: #275889");
  });

  it("themeCssPath указывает на dist/${id}.css", () => {
    expect(themeCssPath("cream-navy")).toBe(DIST_CSS);
  });
});

describe("resolveThemeCss", () => {
  it("добавляет блок :root с оверрайдами документа", () => {
    const css = resolveThemeCss({
      id: "cream-navy",
      overrides: { "color-navy": "#000000" },
    });

    expect(css).toContain("--color-navy: #275889");
    expect(css).toContain("--color-navy: #000000");
  });
});

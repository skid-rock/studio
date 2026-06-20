import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import landingSample from "../../examples/landing.sample.json";
import { parseDocument } from "./document.schema";
import { buildPage } from "./page";
import { renderDocument } from "./render";
import { defaultRegistry } from "../sections/registry.default";
import { resolveThemeCss } from "../tokens/theme";

const baseCss = readFileSync(join(import.meta.dirname, "styles/base.css"), "utf8");
const fontsCss = readFileSync(join(import.meta.dirname, "styles/fonts.css"), "utf8");

describe("buildPage — landing.sample.json", () => {
  it("собирает полный HTML с envelope, hero и closing", () => {
    const doc = parseDocument(landingSample);
    const result = renderDocument(doc, { registry: defaultRegistry });
    const themeCss = resolveThemeCss(doc.theme);
    const html = buildPage(result, { themeCss, baseCss: baseCss + "\n" + fontsCss }, "Полина & Илья");

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('class="envelope-overlay"');
    expect(html).toContain('class="s-hero"');
    expect(html).toContain("Полина &amp; Илья");
    expect(html).toContain('class="s-closing"');
    expect(html).toContain("P.S. Будем рады видеть вас!");
  });

  it("подключает CSS темы и блоков", () => {
    const doc = parseDocument(landingSample);
    const result = renderDocument(doc, { registry: defaultRegistry });
    const html = buildPage(result, { themeCss: resolveThemeCss(doc.theme), baseCss });

    expect(html).toContain("--color-navy: #275889");
    expect(html).toContain(".s-hero {");
    expect(html).toContain(".envelope-overlay");
  });

  it("не содержит следов React/Vite-рантайма", () => {
    const doc = parseDocument(landingSample);
    const result = renderDocument(doc, { registry: defaultRegistry });
    const html = buildPage(result, { themeCss: resolveThemeCss(doc.theme), baseCss });

    expect(html).not.toContain("react");
    expect(html).not.toContain("__vite");
    expect(html).not.toContain("dangerouslySetInnerHTML");
  });

  it("использует относительные пути к ассетам", () => {
    const doc = parseDocument(landingSample);
    const result = renderDocument(doc, { registry: defaultRegistry });
    const html = buildPage(result, {
      themeCss: resolveThemeCss(doc.theme),
      baseCss: baseCss + "\n" + fontsCss,
    });

    expect(html).toContain('src="img/seal.png"');
    expect(html).toContain('url("fonts/Floriselscript.woff")');
  });
});

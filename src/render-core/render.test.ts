import { describe, expect, it } from "vitest";

import type { StudioDocument } from "./document";
import { createRegistry } from "./registry";
import { renderDocument } from "./render";
import { defaultsFromSchema, type ParamSchema } from "./schema";
import type { BlockModule } from "./types";

/** Минимальный документ с указанными секциями (order задаёт порядок рендера). */
function makeDoc(sections: StudioDocument["sections"]): StudioDocument {
  return {
    schemaVersion: 1,
    theme: { id: "cream-navy" },
    motion: { preset: "subtle" },
    sections,
  };
}

function makeDemoModule(overrides: Partial<BlockModule> = {}): BlockModule {
  const schema: ParamSchema = [{ group: "Основное", items: [{ key: "title", type: "text", label: "Заголовок", def: "Demo" }] }];
  return {
    type: "demo",
    label: "Demo",
    schema,
    defaults: defaultsFromSchema(schema),
    render: (props) => `<section>${String(props.title)}</section>`,
    css: ".demo { color: red; }",
    ...overrides,
  };
}

describe("renderDocument", () => {
  it("рендерит известные секции в порядке order", () => {
    const registry = createRegistry([makeDemoModule()]);
    const doc = makeDoc([
      { id: "b", type: "demo", order: "b0", props: { title: "Second" } },
      { id: "a", type: "demo", order: "a0", props: { title: "First" } },
    ]);

    const result = renderDocument(doc, { registry });

    expect(result.html).toBe("<section>First</section>\n<section>Second</section>");
  });

  it("не падает на неизвестный type — оставляет HTML-комментарий", () => {
    const registry = createRegistry([makeDemoModule()]);
    const doc = makeDoc([
      { id: "known", type: "demo", order: "a0", props: { title: "OK" } },
      { id: "unknown", type: "missing/block", order: "a1", props: {} },
    ]);

    const result = renderDocument(doc, { registry });

    expect(result.html).toContain("<section>OK</section>");
    expect(result.html).toContain("<!-- unknown block: missing/block -->");
  });

  it("экранирует -- в комментарии для неизвестного type", () => {
    const registry = createRegistry([]);
    const doc = makeDoc([{ id: "x", type: "bad--type", order: "a0", props: {} }]);

    const result = renderDocument(doc, { registry });

    expect(result.html).toBe("<!-- unknown block: bad—type -->");
  });

  it("дедуплицирует CSS по type (один блок CSS на тип)", () => {
    const registry = createRegistry([makeDemoModule()]);
    const doc = makeDoc([
      { id: "a", type: "demo", order: "a0", props: { title: "A" } },
      { id: "b", type: "demo", order: "a1", props: { title: "B" } },
    ]);

    const result = renderDocument(doc, { registry });

    expect(result.css).toBe(".demo { color: red; }");
  });

  it("собирает CSS только от использованных модулей", () => {
    const demo = makeDemoModule({ css: ".demo { color: red; }" });
    const hero = makeDemoModule({
      type: "hero",
      label: "Hero",
      css: ".hero { font-size: 2rem; }",
      render: () => "<section class=\"hero\"></section>",
    });
    const registry = createRegistry([demo, hero]);
    const doc = makeDoc([{ id: "only-demo", type: "demo", order: "a0", props: { title: "X" } }]);

    const result = renderDocument(doc, { registry });

    expect(result.css).toContain(".demo { color: red; }");
    expect(result.css).not.toContain(".hero");
    expect(result.css).not.toContain("--color-navy:");
  });

  it("не включает CSS темы — только CSS блоков", () => {
    const registry = createRegistry([makeDemoModule()]);
    const doc = makeDoc([{ id: "s", type: "demo", order: "a0", props: { title: "X" } }]);

    const result = renderDocument(doc, { registry });

    expect(result.css).not.toContain(":root {");
    expect(result.css).not.toContain("--color-navy: #275889");
  });

  it("передаёт контекст документа в render", () => {
    const doc = makeDoc([{ id: "s", type: "ctx", order: "a0", props: {} }]);
    const module: BlockModule = {
      type: "ctx",
      label: "Ctx",
      schema: [],
      defaults: {},
      render: (_props, ctx) => `<section data-theme="${ctx.doc.theme.id}"></section>`,
    };
    const registry = createRegistry([module]);

    const result = renderDocument(doc, { registry });

    expect(result.html).toBe('<section data-theme="cream-navy"></section>');
  });
});

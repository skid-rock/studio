/**
 * Прод-тест Puck-адаптера (STUDIO-010): round-trip document↔Puck, экспорт,
 * анти-drift BlockPreview vs строковый mod.render.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Data } from "@measured/puck";
import type { StudioDocument } from "../render-core/document";
import { sortedSections } from "../render-core/document";
import { renderDocument } from "../render-core/render";
import { defaultRegistry } from "../sections/registry.default";
import { BlockPreview } from "./block-preview";
import {
  documentToPuck,
  puckToDocument,
  toPuckType,
  toStudioType,
} from "./puck-adapter";
import { renderModuleHtml } from "./render-block-html";

/** Стартовый документ: конверт + hero + closing (как в spike verify). */
const DOC0: StudioDocument = {
  schemaVersion: 1,
  theme: { id: "cream-navy" },
  motion: { preset: "subtle" },
  sections: [
    { id: "s_intro", type: "intro/envelope", order: "a0", props: {} },
    {
      id: "s_hero",
      type: "hero",
      order: "a1",
      props: { eyebrow: "Мы женимся", names: "Полина & Илья", date: "05.08.2026" },
    },
    {
      id: "s_closing",
      type: "closing",
      order: "a2",
      props: { signature: "С любовью, Полина & Илья", ps: "Будем рады видеть вас!" },
    },
  ],
};

/** Сценарий редактора: правка prop, reorder через DnD, add из палитры. */
function simulateEditorChanges(data0: Data): Data {
  const edited: Data = {
    ...data0,
    content: data0.content.map((c) =>
      c.props.id === "s_hero" ? { ...c, props: { ...c.props, names: "Аня & Боря" } } : c,
    ),
  };

  const closing = edited.content.find((c) => c.props.id === "s_closing")!;
  const reordered: Data = {
    ...edited,
    content: [closing, ...edited.content.filter((c) => c.props.id !== "s_closing")],
  };

  return {
    ...reordered,
    content: [
      ...reordered.content,
      { type: toPuckType("intro/envelope"), props: { id: "s_intro2" } },
    ],
  };
}

describe("toPuckType / toStudioType", () => {
  it("экранирует слэш в type и восстанавливает обратно", () => {
    expect(toPuckType("intro/envelope")).toBe("intro--envelope");
    expect(toStudioType("intro--envelope")).toBe("intro/envelope");
  });
});

describe("documentToPuck", () => {
  it("маппит секции в Puck Data с экранированным type и props.id", () => {
    const data = documentToPuck(DOC0);

    expect(data.content).toHaveLength(3);
    expect(data.content.every((c) => !c.type.includes("/"))).toBe(true);
    expect(data.content.every((c) => typeof c.props.id === "string")).toBe(true);
  });
});

describe("puckToDocument round-trip", () => {
  it("вставка в середину сохраняет ключи соседей", () => {
    const data0 = documentToPuck(DOC0);
    const hero = data0.content.find((c) => c.props.id === "s_hero")!;
    const closing = data0.content.find((c) => c.props.id === "s_closing")!;
    const intro = data0.content.find((c) => c.props.id === "s_intro")!;
    const inserted: Data = {
      ...data0,
      content: [intro, hero, { type: toPuckType("hero"), props: { id: "s_new" } }, closing],
    };

    const doc1 = puckToDocument(inserted, DOC0);
    const byId = Object.fromEntries(doc1.sections.map((s) => [s.id, s.order]));

    expect(byId.s_intro).toBe("a0");
    expect(byId.s_hero).toBe("a1");
    expect(byId.s_closing).toBe("a2");
    expect(byId.s_new! > "a1" && byId.s_new! < "a2").toBe(true);
  });

  it("удаление не трогает ключи оставшихся секций", () => {
    const data0 = documentToPuck(DOC0);
    const withoutHero: Data = {
      ...data0,
      content: data0.content.filter((c) => c.props.id !== "s_hero"),
    };

    const doc1 = puckToDocument(withoutHero, DOC0);
    const byId = Object.fromEntries(doc1.sections.map((s) => [s.id, s.order]));

    expect(byId.s_intro).toBe("a0");
    expect(byId.s_closing).toBe("a2");
    expect(doc1.sections).toHaveLength(2);
  });

  it("сохраняет правки, порядок и дробный order после edit/reorder/add", () => {
    const data0 = documentToPuck(DOC0);
    const added = simulateEditorChanges(data0);
    const doc1 = puckToDocument(added, DOC0);
    const sorted = sortedSections(doc1);

    expect(doc1.sections).toHaveLength(4);
    expect(sorted.map((s) => s.id).join(",")).toBe(
      added.content.map((c) => c.props.id).join(","),
    );

    const orders = sorted.map((s) => s.order);
    expect(orders.every((o, i) => i === 0 || orders[i - 1]! < o)).toBe(true);

    expect(doc1.schemaVersion).toBe(1);
    expect(doc1.theme.id).toBe("cream-navy");
    expect(sorted.filter((s) => s.type === "intro/envelope")).toHaveLength(2);
    expect(sorted.find((s) => s.id === "s_hero")?.props.names).toBe("Аня & Боря");
  });
});

describe("renderDocument после round-trip", () => {
  it("даёт строковый HTML без React-рантайма и с отредактированным контентом", () => {
    const data0 = documentToPuck(DOC0);
    const doc1 = puckToDocument(simulateEditorChanges(data0), DOC0);
    const out = renderDocument(doc1, { registry: defaultRegistry });

    expect(typeof out.html).toBe("string");
    expect(out.html.length).toBeGreaterThan(0);
    expect(typeof out.css).toBe("string");
    expect(/data-reactroot|__reactProps\$|reactFiber/i.test(out.html)).toBe(false);
    expect(out.html).toContain("envelope-overlay");
    expect(out.html).toContain("Аня");
  });
});

describe("BlockPreview anti-drift", () => {
  it("вставляет ровно строковый HTML mod.render без лишней обёртки внутри блока", () => {
    const data0 = documentToPuck(DOC0);
    const doc1 = puckToDocument(simulateEditorChanges(data0), DOC0);
    const first = sortedSections(doc1)[0]!;
    const mod = defaultRegistry.get(first.type)!;

    const agnostic = renderModuleHtml(mod, first.props, doc1);
    const reactHtml = renderToStaticMarkup(
      createElement(BlockPreview, { mod, props: { ...first.props, id: first.id }, doc: doc1 }),
    );

    expect(reactHtml).toContain(agnostic);
    expect(reactHtml).toMatch(/^<div class="editor-block" data-block="[^"]+">/);
  });
});

import { describe, expect, it } from "vitest";

import { createRegistry } from "./registry";
import { defaultsFromSchema, parseBySchema, type ParamSchema } from "./schema";
import type { BlockModule } from "./types";

/** Фиктивный модуль для изолированных сценариев реестра. */
function makeDemoModule(overrides: Partial<BlockModule> = {}): BlockModule {
  const schema: ParamSchema = [{ group: "Основное", items: [{ key: "title", type: "text", label: "Заголовок", def: "Demo" }] }];
  return {
    type: "demo",
    label: "Demo",
    schema,
    defaults: defaultsFromSchema(schema),
    render: (props) => `<section>${String(props.title)}</section>`,
    ...overrides,
  };
}

describe("createRegistry", () => {
  it("возвращает модуль по type через get", () => {
    const demo = makeDemoModule();
    const registry = createRegistry([demo]);

    expect(registry.get("demo")).toBe(demo);
    expect(registry.get("missing")).toBeUndefined();
  });

  it("инициализируется переданным списком модулей", () => {
    const hero = makeDemoModule({ type: "hero", label: "Hero" });
    const closing = makeDemoModule({ type: "closing", label: "Closing" });
    const registry = createRegistry([hero, closing]);

    expect(registry.list()).toEqual([hero, closing]);
  });

  it("добавляет модуль через register", () => {
    const registry = createRegistry();
    const demo = makeDemoModule();

    registry.register(demo);

    expect(registry.get("demo")).toBe(demo);
    expect(registry.list()).toEqual([demo]);
  });

  it("перезаписывает модуль при повторной регистрации того же type", () => {
    const registry = createRegistry([makeDemoModule()]);
    const updated = makeDemoModule({ label: "Demo v2" });

    registry.register(updated);

    expect(registry.get("demo")?.label).toBe("Demo v2");
    expect(registry.list()).toHaveLength(1);
  });
});

describe("defaultsFromSchema", () => {
  it("собирает дефолты из всех групп и типов параметров", () => {
    const schema: ParamSchema = [
      {
        group: "Числа",
        items: [{ key: "size", label: "Размер", min: 0, max: 100, step: 1, def: 42, unit: "px" }],
      },
      {
        group: "Цвета",
        items: [{ key: "bg", type: "color", label: "Фон", def: "#fff" }],
      },
      {
        group: "Тексты",
        items: [{ key: "title", type: "text", label: "Заголовок", def: "Hello" }],
      },
      {
        group: "Выбор",
        items: [
          {
            key: "layout",
            type: "select",
            label: "Лейаут",
            options: [
              { value: "a", label: "A" },
              { value: "b", label: "B" },
            ],
            def: "a",
          },
        ],
      },
    ];

    expect(defaultsFromSchema(schema)).toEqual({
      size: 42,
      bg: "#fff",
      title: "Hello",
      layout: "a",
    });
  });
});

describe("parseBySchema", () => {
  const schema: ParamSchema = [
    {
      group: "Числа",
      items: [{ key: "size", label: "Размер", min: 0, max: 100, step: 1, def: 42, unit: "px" }],
    },
    {
      group: "Цвета",
      items: [{ key: "bg", type: "color", label: "Фон", def: "#fff" }],
    },
    {
      group: "Тексты",
      items: [{ key: "title", type: "text", label: "Заголовок", def: "Hello" }],
    },
    {
      group: "Выбор",
      items: [
        {
          key: "layout",
          type: "select",
          label: "Лейаут",
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
          def: "a",
        },
      ],
    },
  ];

  it("отбрасывает неизвестные ключи и сохраняет валидные", () => {
    expect(parseBySchema(schema, { evil: "x", title: "ok" })).toEqual({
      size: 42,
      bg: "#fff",
      title: "ok",
      layout: "a",
    });
  });

  it("подставляет def при неверном типе значения", () => {
    expect(parseBySchema(schema, { size: "not-a-number", title: 123 })).toEqual({
      size: 42,
      bg: "#fff",
      title: "Hello",
      layout: "a",
    });
  });

  it("select: значение вне options → def; из options → принимается", () => {
    expect(parseBySchema(schema, { layout: "unknown" }).layout).toBe("a");
    expect(parseBySchema(schema, { layout: "b" }).layout).toBe("b");
  });

  it("raw не объект → все ключи = def (полный объект)", () => {
    expect(parseBySchema(schema, null)).toEqual({
      size: 42,
      bg: "#fff",
      title: "Hello",
      layout: "a",
    });
    expect(parseBySchema(schema, undefined)).toEqual({
      size: 42,
      bg: "#fff",
      title: "Hello",
      layout: "a",
    });
    expect(parseBySchema(schema, 42)).toEqual({
      size: 42,
      bg: "#fff",
      title: "Hello",
      layout: "a",
    });
  });

  it("результат содержит ровно ключи схемы", () => {
    const result = parseBySchema(schema, { title: "Custom" });
    expect(Object.keys(result).sort()).toEqual(["bg", "layout", "size", "title"]);
  });
});

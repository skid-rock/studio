/**
 * СПАЙК (STUDIO-008) — мини-редактор на Puck поверх нашей модели/render.
 *
 * Что демонстрирует спайк:
 *  - палитра + DnD Puck добавляют/переставляют/удаляют наши секции;
 *  - панель свойств строится из нашей ParamSchema (range/text/select/color);
 *  - холст рисует блок нашим агностичным mod.render (никакого второго рендера);
 *  - кнопка «Экспорт» гонит текущее состояние через renderDocument — строка
 *    HTML без React (тот же путь, что в Node-экспорте STUDIO-009).
 *
 * Это одноразовый спайк: НЕ в src/, в прод-сборку не входит.
 */
import { useMemo, useRef, useState } from "react";
import { Puck } from "@measured/puck";
import type { Data } from "@measured/puck";
import "@measured/puck/puck.css";

import type { StudioDocument } from "../../src/render-core/document";
import { renderDocument } from "../../src/render-core/render";
import { defaultRegistry } from "../../src/sections/registry.default";
import { documentToPuck, makeConfig, puckToDocument } from "./puck-adapter";

import baseCss from "../../src/render-core/styles/base.css?raw";
import fontsCss from "../../src/render-core/styles/fonts.css?raw";
import creamNavyCss from "../../src/tokens/dist/cream-navy.css?raw";

/** Стартовый документ спайка: конверт + hero + closing (есть что переставлять). */
const INITIAL_DOC: StudioDocument = {
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

/** CSS темы/базы для холста превью (как в src/App.tsx — через ?raw). */
const FRAME_CSS = [baseCss, fontsCss, creamNavyCss].join("\n");

/**
 * Локальные правки для спайка: конверт в проде — полноэкранный fixed-оверлей;
 * в холсте редактора нейтрализуем его в обычный блок с фиксированной высотой.
 */
const SPIKE_CSS = `
.spike-block[data-block="intro/envelope"] {
  position: relative;
  height: 70vh;
  max-height: 560px;
  overflow: hidden;
}
.spike-block[data-block="intro/envelope"] .envelope-overlay {
  position: absolute;
}
.spike-export {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}
.spike-export button {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #275889;
  background: #275889;
  color: #fff;
  cursor: pointer;
  font: 14px/1.2 system-ui, sans-serif;
}
.spike-export pre {
  max-width: 420px;
  max-height: 240px;
  overflow: auto;
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  background: #0d1b2a;
  color: #cfe3ff;
  font: 11px/1.4 ui-monospace, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
`;

export function App() {
  // Документ держим в ref — обёртки блоков читают актуальный doc для RenderContext.
  const docRef = useRef<StudioDocument>(INITIAL_DOC);
  const [data, setData] = useState<Data>(() => documentToPuck(INITIAL_DOC));
  const [exported, setExported] = useState<string | null>(null);

  const config = useMemo(
    () => makeConfig(defaultRegistry, () => docRef.current),
    [],
  );

  function handleChange(next: Data) {
    setData(next);
    docRef.current = puckToDocument(next, INITIAL_DOC);
  }

  // Агностичный экспорт: Puck Data → StudioDocument → renderDocument (строка HTML).
  function handleExport() {
    const doc = puckToDocument(data, INITIAL_DOC);
    const { html, css } = renderDocument(doc, { registry: defaultRegistry });
    const hasReact = /data-reactroot|__reactProps|<script/i.test(html);
    setExported(
      `// секций: ${doc.sections.length} · React в выводе: ${hasReact ? "ДА (ошибка!)" : "нет"}\n` +
        `// html: ${html.length} байт · css: ${css.length} байт\n\n` +
        html.slice(0, 900) +
        (html.length > 900 ? "\n…" : ""),
    );
  }

  return (
    <>
      <style>{FRAME_CSS}</style>
      <style>{SPIKE_CSS}</style>
      <Puck config={config} data={data} onChange={handleChange} />
      <div className="spike-export">
        {exported && <pre>{exported}</pre>}
        <button type="button" onClick={handleExport}>
          Экспорт (агностичный renderDocument)
        </button>
      </div>
    </>
  );
}

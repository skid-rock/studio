/**
 * Статический экспорт демо-лендинга Фазы 0 (Node, без React).
 * Тот же renderDocument + buildPage, что и превью в браузере.
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseDocument } from "../src/render-core/document.schema";
import { buildPage } from "../src/render-core/page";
import { renderDocument } from "../src/render-core/render";
import { defaultRegistry } from "../src/sections/registry.default";
import { resolveThemeCss } from "../src/tokens/theme";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "dist-export");

const rawDoc = JSON.parse(readFileSync(join(ROOT, "examples/landing.sample.json"), "utf8"));
const doc = parseDocument(rawDoc);
const result = renderDocument(doc, { registry: defaultRegistry });

const baseCss =
  readFileSync(join(ROOT, "src/render-core/styles/base.css"), "utf8") +
  "\n" +
  readFileSync(join(ROOT, "src/render-core/styles/fonts.css"), "utf8");
const themeCss = resolveThemeCss(doc.theme);
const html = buildPage(result, { themeCss, baseCss }, "Полина & Илья");

mkdirSync(join(OUT_DIR, "img"), { recursive: true });
writeFileSync(join(OUT_DIR, "index.html"), html, "utf8");

const sealSrc = join(ROOT, "public/img/seal.png");
if (existsSync(sealSrc)) {
  copyFileSync(sealSrc, join(OUT_DIR, "img/seal.png"));
}

const fontsSrc = join(ROOT, "public/fonts");
if (existsSync(fontsSrc)) {
  cpSync(fontsSrc, join(OUT_DIR, "fonts"), { recursive: true });
}

console.log(`Экспортировано: ${join(OUT_DIR, "index.html")}`);

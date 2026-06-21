import { PUCK_INTERNAL_KEYS } from "./render-block-html";

/**
 * Равенство props секции для memo: сравниваем значимые поля, ИГНОРИРУЯ служебные
 * Puck-поля (id/puck/editMode) — они нестабильны между рендерами, иначе memo
 * считал бы props всегда «новыми» и перерисовывал бы каждую секцию.
 * Экспортируется как чистая функция — покрывается юнит-тестом (DoD «точечность»).
 */
export function samePuckProps(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const ka = Object.keys(a).filter((k) => !PUCK_INTERNAL_KEYS.has(k));
  const kb = Object.keys(b).filter((k) => !PUCK_INTERNAL_KEYS.has(k));
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.is(a[k], b[k]));
}

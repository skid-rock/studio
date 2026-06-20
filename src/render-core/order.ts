import { generateKeyBetween } from "fractional-indexing";

/** Ключ порядка для вставки между a и b (любой из них может быть null — край). */
export function orderBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a, b);
}

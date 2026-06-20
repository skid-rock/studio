import type { StudioDocument } from "./document";
import type { ParamSchema } from "./schema";

/** Контекст рендера (расширяемый: доступ к документу/теме при необходимости). */
export interface RenderContext {
  doc: StudioDocument;
}

/**
 * Render блока: ЧИСТАЯ функция props → строка HTML.
 * Без React, без обращения к глобальному document/DOM (должна работать и в Node).
 */
export type RenderFn<P = Record<string, unknown>> = (props: P, ctx: RenderContext) => string;

/** Модуль блока в реестре. */
export interface BlockModule<P extends Record<string, unknown> = Record<string, unknown>> {
  type: string; // напр. "intro/envelope", "hero"
  label: string; // человекочитаемое имя (для палитры редактора в Фазе 1)
  schema: ParamSchema; // параметры блока
  defaults: P; // дефолтные props (обычно defaultsFromSchema(schema))
  render: RenderFn<P>; // агностичный render
  css?: string; // CSS модуля, попадающий в вывод (один раз на тип)
}

/** Результат рендера документа. */
export interface RenderResult {
  html: string; // содержимое <body> (конкатенация секций)
  css: string; // объединённый CSS использованных модулей (без дублей)
}

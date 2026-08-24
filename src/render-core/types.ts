import type { StudioDocument } from './document';
import type { ParamSchema } from './schema';

/** Контекст рендера (расширяемый: доступ к документу/теме при необходимости). */
export interface RenderContext {
    doc: StudioDocument;
    /**
     * Идентичность экземпляра секции — id узла документа (ADR-0008). Живёт в
     * контексте, а не в props: это не редактируемые данные секции, в схеме её
     * быть не должно (иначе вылезет в панель свойств), а parseBySchema всё равно
     * отбросил бы ключ вне схемы. Нужна модулям, которым требуется уникальный на
     * странице HTML-id (якорь попапа RSVP), чтобы два экземпляра не столкнулись.
     */
    sectionId: string;
}

/**
 * Render блока: ЧИСТАЯ функция props → строка HTML.
 * Без React, без обращения к глобальному document/DOM (должна работать и в Node).
 */
export type RenderFn<P = Record<string, unknown>> = (
    props: P,
    ctx: RenderContext,
) => string;

/** Модуль блока в реестре. */
export interface BlockModule<
    P extends Record<string, unknown> = Record<string, unknown>,
> {
    type: string; // напр. "intro/envelope", "hero"
    label: string; // человекочитаемое имя (для палитры редактора в Фазе 1)
    schema: ParamSchema; // параметры блока
    defaults: P; // дефолтные props (обычно defaultsFromSchema(schema))
    render: RenderFn<P>; // агностичный render
    css?: string; // CSS модуля, попадающий в вывод (один раз на тип)
    /**
     * Клиентский скрипт модуля (IIFE-строка), один раз на тип — по аналогии с css.
     * НЕ исполняется на рендере (агностичность, ADR-0002): это статичные данные.
     * Исполняется ТОЛЬКО в браузере — buildPage кладёт его в <script> (экспорт),
     * а в холсте редактора прогоняет edit-time бридж (src/editor/). Обязан быть
     * идемпотентным и самоочищающимся (повторный прогон/ре-рендер безопасны).
     */
    js?: string;
}

/** Результат рендера документа. */
export interface RenderResult {
    html: string; // содержимое <body> (конкатенация секций)
    css: string; // объединённый CSS использованных модулей (без дублей)
    js: string; // объединённый клиентский JS использованных модулей (без дублей)
}

/**
 * Чистый render конверта: EnvelopeState → строка HTML (.envelope-overlay).
 *
 * В wed функция renderEnvelope мутировала готовую разметку (см. render.ts).
 * Здесь — чистая функция props → строка (контракт RenderFn из render-core,
 * ADR-0002): модуль сам генерирует разметку и подставляет вычисленные значения
 * как строки (атрибуты d, инлайновый style="--...", тексты). Логика вычислений
 * перенесена из wed без изменений.
 *
 * Render не обращается к document/window — работает и в Node-экспорте.
 */
import type { EnvelopeState } from './state';
import { buildPaths } from './geometry';
import { resolveEnvelopeShift } from './shift';

/** #rrggbb + альфа → rgba(). Дословный порт из wed/render.ts. */
export function hexToRgba(hex: string, alpha: number): string {
    const n = parseInt(hex.slice(1), 16);

    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Перенос строки → <br> для верхнего текста. Дословный порт из wed/render.ts. */
function deliveryToHtml(text: string): string {
    return text.replace(/\n/g, '<br>');
}

/** Инициалы: « & » обрамляем неразрывными пробелами. Дословный порт из wed/render.ts. */
function initialsToHtml(text: string): string {
    return text.replace(/\s*&\s*/g, '&nbsp;&amp;&nbsp;');
}

/** Простое экранирование для текста печати (защита от < и &). */
function escapeText(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Чистый render конверта: EnvelopeState → строка HTML (.envelope-overlay). */
export function renderEnvelopeHtml(s: EnvelopeState): string {
    const paths = buildPaths(s);
    const { cssX, cssY } = resolveEnvelopeShift(s);

    // Соответствие 1:1 из wed/render.ts (строки 62–78).
    const vars: Record<string, string> = {
        '--envelope-panel-fill': hexToRgba(s.paperColor, s.paperAlpha),
        '--envelope-bg': s.bgColor,
        '--envelope-line-color': s.lineColor,
        '--envelope-line-width': String(s.lineWidth),
        '--envelope-line-opacity': String(s.lineOpacity),
        '--envelope-delivery-top': `${s.deliveryY}%`,
        '--envelope-delivery-size': `${s.deliveryFont}rem`,
        '--envelope-initials-top': `${s.initialsY}%`,
        '--envelope-initials-size': `${s.initialsFont}rem`,
        '--envelope-seal-top': `${s.sealY}%`,
        '--envelope-seal-size': `${s.sealSize}px`,
        '--envelope-seal-text-top': `${s.sealTextY}%`,
        '--envelope-seal-text-size': `${s.sealFont}rem`,
        '--envelope-flap-shift-x': cssX,
        '--envelope-flap-shift-y': cssY,
    };

    const styleVars = Object.entries(vars)
        .map(([k, v]) => `${k}: ${v};`)
        .join(' ');

    // TODO (Фаза 1): для пользовательского ввода в deliveryText/initialsText
    // добавить экранирование — сейчас функции вставляют разрешённый HTML (<br>,
    // &nbsp;) и рассчитаны на наши же дефолты.
    // TODO STUDIO-015: deliveryText/initialsText под inline пока не помечены data-prop —
    // их содержимое трансформируется (<br>, &nbsp;), якорь ≠ raw; нужен un-transform
    // в edit-time слое.
    return `
<div class="envelope-overlay" id="envelope" role="dialog" aria-modal="true" aria-label="Открыть приглашение" style="${styleVars}">
  <div class="envelope__flaps" aria-hidden="true">
    <div class="envelope__quarter envelope__quarter--left">
      <svg class="envelope__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="envelope__flap" d="${paths.left}" /></svg></div>
    <div class="envelope__quarter envelope__quarter--right">
      <svg class="envelope__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="envelope__flap" d="${paths.right}" /></svg></div>
    <div class="envelope__quarter envelope__quarter--bottom">
      <svg class="envelope__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="envelope__flap" d="${paths.bottom}" /></svg></div>
    <div class="envelope__quarter envelope__quarter--top">
      <svg class="envelope__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="envelope__flap" d="${paths.top}" /></svg></div>
  </div>
  <p class="envelope__delivery">${deliveryToHtml(s.deliveryText)}</p>
  <button type="button" class="envelope__seal" id="envelope-seal" aria-label="Открыть приглашение">
    <img class="envelope__seal-img" src="img/seal.png" alt="" aria-hidden="true" />
    <span class="envelope__seal-text" data-prop="sealText">${escapeText(s.sealText)}</span>
  </button>
  <p class="envelope__initials">${initialsToHtml(s.initialsText)}</p>
</div>`;
}

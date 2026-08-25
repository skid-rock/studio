/**
 * Блок countdown — обратный отсчёт по морскому макету (Figma 423:484).
 * От донора из wed остались клиентский тик (поле js) и якоря data-countdown-*,
 * остальное перестроено под макет: фон-фото с кропом, белый текст, карточка
 * shell с монограммой. Render агностичен к React.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface CountdownProps extends Record<string, unknown> {
    bgUrl: string;
    eyebrow: string;
    target: string; // ISO-дата цели, напр. 2026-08-05T15:00:00+03:00
    lDays: string;
    lHours: string;
    lMinutes: string;
    lSeconds: string;
    letter1: string;
    amp: string;
    letter2: string;
}

const schema: ParamSchema = [
    {
        group: 'Обратный отсчёт',
        items: [
            {
                key: 'bgUrl',
                label: 'Фон (URL)',
                type: 'text',
                def: '/img/countdown/bg.jpg',
            },
            {
                key: 'eyebrow',
                label: 'Подпись сверху',
                type: 'text',
                def: 'ЖДЕМ ВСТРЕЧИ С ВАМИ',
            },
            {
                key: 'target',
                label: 'Целевая дата (ISO)',
                type: 'text',
                def: '2026-08-05T15:00:00+03:00',
            },
            { key: 'lDays', label: 'Подпись: дни', type: 'text', def: 'дней' },
            {
                key: 'lHours',
                label: 'Подпись: часы',
                type: 'text',
                def: 'час',
            },
            {
                key: 'lMinutes',
                label: 'Подпись: минуты',
                type: 'text',
                def: 'минут',
            },
            {
                key: 'lSeconds',
                label: 'Подпись: секунды',
                type: 'text',
                def: 'секунд',
            },
            {
                key: 'letter1',
                label: 'Монограмма: буква 1',
                type: 'text',
                def: 'Д',
            },
            { key: 'amp', label: 'Монограмма: знак', type: 'text', def: '&' },
            {
                key: 'letter2',
                label: 'Монограмма: буква 2',
                type: 'text',
                def: 'М',
            },
        ],
    },
];

/** Ракушка — декор макета, в редакторе не меняется. */
const SHELL_IMG = '/img/countdown/shell.png';

const css = `
.s-countdown {
  background: var(--color-cream);
  color: var(--color-white);
}
.s-countdown__inner {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rem;
  width: 100%;
  max-width: 24.5625rem;
  margin: 0 auto;
  padding: 2rem;
  overflow: hidden;
}
/* фон: CROP макета развёрнут в размеры и сдвиг растянутого img (imageTransform 423:484).
   filter — приближение цветокоррекции заливки в Figma, точного аналога у неё нет. */
.s-countdown__bg {
  position: absolute;
  left: -36.13%;
  top: -34.5%;
  width: 184.22%;
  height: 175.39%;
  object-fit: fill;
  filter: contrast(0.9) saturate(0.94) brightness(0.97);
  pointer-events: none;
}
.s-countdown__title {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}
.s-countdown__eyebrow {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.1;
  text-align: center;
}
.s-countdown__grid {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 17.8125rem;
}
.s-countdown__unit {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}
.s-countdown__value,
.s-countdown__label {
  font-family: var(--font-body);
  font-size: 1.125rem;
  font-weight: 300;
  line-height: 1.28;
}
/* карточка ракушки: тень по альфе PNG — drop-shadow, не box-shadow (см. токен) */
.s-countdown__shell {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 10.125rem;
  height: 10.5rem;
  filter: var(--filter-shell);
}
.s-countdown__shell-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.s-countdown__monogram {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-family: var(--font-display);
  color: var(--color-navy);
}
.s-countdown__letter {
  font-size: 3rem;
  line-height: 1;
}
.s-countdown__amp {
  font-size: 1.5rem;
  line-height: 1;
}
`;

// Клиентский скрипт тика — из донора без изменений, кроме pad дней (в макете «00»).
// Идемпотентность: таймер хранится на самом узле (root.__cdTimer) — повторная
// привязка no-op. Самоочистка: при откреплении узла (!isConnected) интервал гасится.
const js = `
(function(){
  function pad(n,len){ n=String(n); while(n.length<len){ n='0'+n; } return n; }
  function bind(root){
    if (root.__cdTimer) { return; }
    var target = new Date(root.getAttribute('data-countdown-target') || '').getTime();
    var dEl = root.querySelector('[data-countdown="days"]');
    var hEl = root.querySelector('[data-countdown="hours"]');
    var mEl = root.querySelector('[data-countdown="minutes"]');
    var sEl = root.querySelector('[data-countdown="seconds"]');
    if (!dEl || !hEl || !mEl || !sEl || isNaN(target)) { return; }
    function tick(){
      if (!root.isConnected){ clearInterval(root.__cdTimer); root.__cdTimer = null; return; }
      var diff = target - Date.now();
      if (diff < 0) { diff = 0; }
      var t = Math.floor(diff/1000);
      dEl.textContent = pad(Math.floor(t/86400),2);
      hEl.textContent = pad(Math.floor((t%86400)/3600),2);
      mEl.textContent = pad(Math.floor((t%3600)/60),2);
      sEl.textContent = pad(t%60,2);
    }
    tick();
    root.__cdTimer = setInterval(tick, 1000);
  }
  var roots = document.querySelectorAll('[data-countdown-root]');
  for (var i=0;i<roots.length;i++){ bind(roots[i]); }
})();
`;

export const countdownModule: BlockModule<CountdownProps> = {
    type: 'countdown',
    label: 'Обратный отсчёт',
    schema,
    defaults: defaultsFromSchema<CountdownProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<CountdownProps>(schema), ...p };

        const bg =
            props.bgUrl.trim() !== ''
                ? `<img class="s-countdown__bg" src="${esc(props.bgUrl)}" alt="" aria-hidden="true" loading="lazy" />`
                : '';

        // target — в атрибут (per-instance данные). data-prop тут НЕ ставим.
        return `
    <section class="s-countdown">
      <div class="s-countdown__inner">
        ${bg}
        <div class="s-countdown__title">
          <p class="s-countdown__eyebrow" data-prop="eyebrow">${esc(props.eyebrow)}</p>
          <div class="s-countdown__grid" data-countdown-root data-countdown-target="${esc(props.target)}">
            <div class="s-countdown__unit">
              <span class="s-countdown__value" data-countdown="days">00</span>
              <span class="s-countdown__label" data-prop="lDays">${esc(props.lDays)}</span>
            </div>
            <div class="s-countdown__unit">
              <span class="s-countdown__value" data-countdown="hours">00</span>
              <span class="s-countdown__label" data-prop="lHours">${esc(props.lHours)}</span>
            </div>
            <div class="s-countdown__unit">
              <span class="s-countdown__value" data-countdown="minutes">00</span>
              <span class="s-countdown__label" data-prop="lMinutes">${esc(props.lMinutes)}</span>
            </div>
            <div class="s-countdown__unit">
              <span class="s-countdown__value" data-countdown="seconds">00</span>
              <span class="s-countdown__label" data-prop="lSeconds">${esc(props.lSeconds)}</span>
            </div>
          </div>
        </div>
        <div class="s-countdown__shell">
          <img class="s-countdown__shell-img" src="${SHELL_IMG}" alt="" aria-hidden="true" loading="lazy" />
          <p class="s-countdown__monogram">
            <span class="s-countdown__letter" data-prop="letter1">${esc(props.letter1)}</span>
            <span class="s-countdown__amp" data-prop="amp">${esc(props.amp)}</span>
            <span class="s-countdown__letter" data-prop="letter2">${esc(props.letter2)}</span>
          </p>
        </div>
      </div>
    </section>`;
    },
    css,
    js,
};

function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

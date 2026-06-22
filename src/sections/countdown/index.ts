/**
 * Блок countdown — обратный отсчёт до даты (перенос из wed).
 * Первый модуль реестра с клиентским JS (поле js): тик в браузере. Целевая дата —
 * props.target (ISO), хранится в data-countdown-target корня (per-instance данные
 * без генерации кода). Скрипт идемпотентен и самоочищается. Render агностичен.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface CountdownProps extends Record<string, unknown> {
    eyebrow: string;
    target: string; // ISO-дата цели, напр. 2026-08-05T15:00:00+03:00
    lDays: string;
    lHours: string;
    lMinutes: string;
    lSeconds: string;
}

const schema: ParamSchema = [
    {
        group: 'Обратный отсчёт',
        items: [
            {
                key: 'eyebrow',
                label: 'Подпись сверху',
                type: 'text',
                def: 'Уже считаем минутки!',
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
                def: 'часов',
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
        ],
    },
];

const css = `
.s-countdown {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
  text-align: center;
}
.s-countdown__eyebrow {
  font-family: var(--font-script);
  font-size: 1.25rem;
  margin: 0 0 1rem;
}
.s-countdown__grid {
  display: flex;
  justify-content: center;
  gap: clamp(0.5rem, 3vw, 1.25rem);
}
.s-countdown__unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 3.5rem;
}
.s-countdown__value {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 6vw, 2.25rem);
  color: var(--color-terracotta);
  line-height: 1;
}
.s-countdown__label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 0.25rem;
  color: var(--color-text-muted);
}
`;

// Клиентский скрипт тика. ОДИН на тип; обходит все [data-countdown-root].
// Идемпотентность: таймер хранится на самом узле (root.__cdTimer) — повторная
// привязка no-op. Самоочистка: при откреплении узла (!isConnected) интервал
// гасится. Это делает безопасным повторный прогон бриджем после ре-рендера холста.
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
      dEl.textContent = pad(Math.floor(t/86400),3);
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

        // target — в атрибут (per-instance данные). data-prop тут НЕ ставим.
        return `
    <section class="s-countdown">
      <p class="s-countdown__eyebrow" data-prop="eyebrow">${esc(props.eyebrow)}</p>
      <div class="s-countdown__grid" data-countdown-root data-countdown-target="${esc(props.target)}">
        <div class="s-countdown__unit">
          <span class="s-countdown__value" data-countdown="days">000</span>
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
    </section>`;
    },
    css,
    js,
};

function esc(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

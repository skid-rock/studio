/**
 * Фронт-модуль rsvp — анкета гостя (перенос из wed). Клиентская валидация: нативная
 * (required) + прогрессивное улучшение через js? (STUDIO-019). Submit — точка
 * подключения бэкенда Фазы 2 (атрибут action из props.endpoint). Render агностичен.
 */
import type { BlockModule } from '../../render-core/types';
import type { ParamSchema } from '../../render-core/schema';
import { defaultsFromSchema } from '../../render-core/schema';

interface RsvpProps extends Record<string, unknown> {
    title: string;
    lead: string;
    submit: string;
    endpoint: string; // точка подключения бэкенда (Фаза 2); пусто = демо-режим
}

const schema: ParamSchema = [
    {
        group: 'RSVP',
        items: [
            {
                key: 'title',
                label: 'Заголовок',
                type: 'text',
                def: 'Анкета гостя',
            },
            {
                key: 'lead',
                label: 'Подзаголовок',
                type: 'text',
                def: 'Заполните анкету до 01.07.2026, чтобы мы всё подготовили :)',
            },
            { key: 'submit', label: 'Кнопка', type: 'text', def: 'Отправить' },
            {
                key: 'endpoint',
                label: 'Endpoint (Фаза 2)',
                type: 'text',
                def: '',
            },
        ],
    },
];

const css = `
.s-rsvp {
  padding: var(--section-pad-y) var(--section-pad-x);
  background: var(--color-cream);
  color: var(--color-text);
  text-align: center;
}
.s-rsvp__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  margin: 0 0 0.5rem;
}
.s-rsvp__lead {
  font-family: var(--font-body);
  max-width: 32rem;
  margin: 0 auto 1.5rem;
  opacity: 0.85;
}
.s-rsvp__form {
  max-width: 360px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  text-align: left;
}
.s-rsvp__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.s-rsvp__field > span,
.s-rsvp__form legend {
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.s-rsvp__form input[type="text"] {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-navy);
  border-radius: var(--radius-sm);
  background: var(--color-white);
  font: inherit;
}
.s-rsvp__form fieldset {
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.s-rsvp__radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.s-rsvp__hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
  min-height: 1.2em;
}
.s-rsvp__btn {
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  color: var(--color-white);
  background: var(--color-navy);
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
`;

// Клиентский скрипт (прогрессивное улучшение). Идемпотентен: помечает форму
// data-rsvp-init и повторно не навешивает обработчик после ре-рендера холста.
const js = `
(function(){
  var forms = document.querySelectorAll('form[data-rsvp]');
  for (var i=0;i<forms.length;i++){
    var form = forms[i];
    if (form.getAttribute('data-rsvp-init')) continue;
    form.setAttribute('data-rsvp-init','1');
    (function(f){
      var hint = f.querySelector('[data-rsvp-hint]');
      f.addEventListener('submit', function(e){
        // Демо-режим: нет action -> не отправляем, показываем подсказку.
        if (!f.getAttribute('action')) {
          e.preventDefault();
          var data = new FormData(f);
          var name = (data.get('name')||'').toString().trim();
          var attend = (data.get('attend')||'').toString();
          if (!name){ if(hint) hint.textContent='Пожалуйста, укажите имя.'; return; }
          var ok = attend === 'yes';
          if (hint) hint.textContent = 'Спасибо, '+name+'! '+
            (ok ? 'Ждём вас на празднике.' : 'Жаль, что не получится.')+
            ' (демо — данные не сохраняются)';
        }
        // Если action задан (Фаза 2) — даём форме отправиться штатно (POST).
      });
    })(form);
  }
})();
`;

export const rsvpModule: BlockModule<RsvpProps> = {
    type: 'rsvp',
    label: 'RSVP-форма',
    schema,
    defaults: defaultsFromSchema<RsvpProps>(schema),
    render: (p) => {
        const props = { ...defaultsFromSchema<RsvpProps>(schema), ...p };

        // Точка подключения бэкенда (Фаза 2): action из endpoint. Пусто -> демо.
        const action =
            props.endpoint.trim() !== ''
                ? ` action="${escAttr(props.endpoint)}" method="post"`
                : '';

        return `
    <section class="s-rsvp">
      <h2 class="s-rsvp__title" data-prop="title">${esc(props.title)}</h2>
      <p class="s-rsvp__lead" data-prop="lead">${esc(props.lead)}</p>
      <form class="s-rsvp__form" data-rsvp${action}>
        <label class="s-rsvp__field">
          <span>Имя и фамилия</span>
          <input type="text" name="name" autocomplete="name" required />
        </label>
        <fieldset class="s-rsvp__field">
          <legend>Сможете прийти?</legend>
          <label class="s-rsvp__radio">
            <input type="radio" name="attend" value="yes" checked /> Да, с удовольствием
          </label>
          <label class="s-rsvp__radio">
            <input type="radio" name="attend" value="no" /> К сожалению, нет
          </label>
        </fieldset>
        <label class="s-rsvp__field">
          <span>Предпочитаемые напитки</span>
          <input type="text" name="drinks" placeholder="Вино, сок, вода…" />
        </label>
        <p class="s-rsvp__hint" data-rsvp-hint role="status"></p>
        <button type="submit" class="s-rsvp__btn" data-prop="submit">${esc(props.submit)}</button>
      </form>
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

function escAttr(s: string): string {
    return esc(s).replace(/"/g, '&quot;');
}

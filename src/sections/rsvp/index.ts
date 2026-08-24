/**
 * Фронт-модуль rsvp — приглашение и попап анкеты гостя. Клиентская валидация:
 * нативная (required) + прогрессивное улучшение через js (STUDIO-019). Endpoint —
 * точка подключения бэкенда Фазы 2. Render агностичен.
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
                def: 'АНКЕТА ГОСТЯ',
            },
            {
                key: 'lead',
                label: 'Подзаголовок',
                type: 'text',
                def: 'Пожалуйста, перейдите к анкете, нажав на кнопку ниже и ответьте на вопросы до 1 июля 2027',
            },
            {
                key: 'submit',
                label: 'Кнопка секции',
                type: 'text',
                def: 'перейти к анкете',
            },
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
  background: var(--color-cream);
  color: var(--color-text);
}
.s-rsvp__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4375rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 24.5625rem;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
.s-rsvp__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
}
.s-rsvp__lead {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
}
.s-rsvp__open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 2.75rem;
  padding: 0.125rem 2.1875rem;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  color: var(--color-text);
  text-decoration: none;
  background: var(--color-cream);
  box-shadow: var(--shadow-button);
}
.s-rsvp-popup {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 200;
  overflow: auto;
}
.s-rsvp-popup:target {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.s-rsvp-popup__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(21, 20, 20, 0.4);
}
.s-rsvp-popup__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: min(100%, 24.5625rem);
  max-height: 100%;
  margin: 0 auto;
  padding: 2rem;
  overflow: auto;
  background: var(--color-cream);
}
.s-rsvp-popup__close {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  z-index: 1;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 1.5rem;
  line-height: 1;
  text-decoration: none;
}
.s-rsvp__form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  text-align: left;
}
.s-rsvp__field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.s-rsvp__field--name {
  gap: 0.5rem;
}
.s-rsvp__label,
.s-rsvp__description,
.s-rsvp__hint {
  margin: 0;
}
.s-rsvp__description {
  line-height: 1.25;
}
.s-rsvp__name {
  box-sizing: border-box;
  width: 100%;
  height: 2.75rem;
  padding: 0 0 0.5rem;
  border: 0;
  border-bottom: 1px solid var(--color-text);
  border-radius: 0;
  color: var(--color-text);
  background: transparent;
  font: inherit;
  font-size: 1.125rem;
}
.s-rsvp__name::placeholder {
  color: var(--color-text-muted);
  opacity: 1;
}
.s-rsvp__options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.s-rsvp__choice {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.25;
  cursor: pointer;
}
.s-rsvp__choice-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.s-rsvp__control {
  display: inline-flex;
  flex: 0 0 1.125rem;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.0625rem;
  border: 1.5px solid var(--color-text);
}
.s-rsvp__control--radio {
  border-radius: 50%;
}
.s-rsvp__control--radio::after {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: var(--color-text);
  content: "";
  opacity: 0;
}
.s-rsvp__control--checkbox {
  border-radius: 2px;
}
.s-rsvp__control--checkbox::after {
  color: var(--color-cream);
  font-size: 0.75rem;
  line-height: 1;
  content: "✓";
  opacity: 0;
}
.s-rsvp__choice-input:checked + .s-rsvp__control--radio::after {
  opacity: 1;
}
.s-rsvp__choice-input:checked + .s-rsvp__control--checkbox {
  background: var(--color-text);
}
.s-rsvp__choice-input:checked + .s-rsvp__control--checkbox::after {
  opacity: 1;
}
.s-rsvp__choice-input:focus-visible + .s-rsvp__control {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}
.s-rsvp__hint {
  color: var(--color-text-muted);
  text-align: center;
}
.s-rsvp__hint:empty {
  display: none;
}
.s-rsvp__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  box-sizing: border-box;
  width: 10.75rem;
  min-height: 2.8125rem;
  padding: 0.125rem 2.1875rem;
  border: 0;
  color: var(--color-text);
  background: var(--color-cream);
  box-shadow: var(--shadow-button);
  font: inherit;
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
          var presence = (data.get('presence')||'').toString();
          var name = (data.get('name')||'').toString().trim();
          if (!name){ if(hint) hint.textContent='Пожалуйста, укажите имя.'; return; }
          var msg;
          if (presence === 'yes') msg = 'Ждём вас на празднике.';
          else if (presence === 'no') msg = 'Жаль, что не получится.';
          else msg = 'Будем ждать вашего решения.';
          if (hint) hint.textContent = 'Спасибо, '+name+'! '+msg+
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
    render: (p, ctx) => {
        const props = { ...defaultsFromSchema<RsvpProps>(schema), ...p };
        // Якорь попапа уникален на странице: идентичность экземпляра берётся из
        // контекста (ADR-0008), а не из props — в схеме её нет и быть не должно.
        const popupId = `rsvp-${slug(ctx.sectionId) || 'popup'}`;

        // Точка подключения бэкенда (Фаза 2): action из endpoint. Пусто -> демо.
        const action =
            props.endpoint.trim() !== ''
                ? ` action="${escAttr(props.endpoint)}" method="post"`
                : '';

        return `
    <section class="s-rsvp">
      <div class="s-rsvp__inner">
        <h2 class="s-rsvp__title" data-prop="title">${esc(props.title)}</h2>
        <p class="s-rsvp__lead" data-prop="lead">${esc(props.lead)}</p>
        <a class="s-rsvp__open" href="#${escAttr(popupId)}" data-prop="submit">${esc(props.submit)}</a>
      </div>
      <div class="s-rsvp-popup" id="${escAttr(popupId)}">
        <a class="s-rsvp-popup__backdrop" href="#" aria-hidden="true"></a>
        <div class="s-rsvp-popup__panel" role="dialog" aria-label="Анкета гостя">
          <a class="s-rsvp-popup__close" href="#" aria-label="Закрыть">×</a>
          <form class="s-rsvp__form" data-rsvp${action}>
            <label class="s-rsvp__field s-rsvp__field--name">
              <span class="s-rsvp__label">Имя и Фамилия</span>
              <span class="s-rsvp__description">если будете с парой или семьей, внесите все имена и фамилии</span>
              <input class="s-rsvp__name" type="text" name="name" autocomplete="name" placeholder="Анна Иванова" required />
            </label>
            <fieldset class="s-rsvp__field">
              <legend class="s-rsvp__label">Присутствие</legend>
              <div class="s-rsvp__options">
                ${choice('radio', 'presence', 'yes', 'обязательно буду', true)}
                ${choice('radio', 'presence', 'no', 'к сожалению, не смогу')}
                ${choice('radio', 'presence', 'maybe', 'пока не уверен(а)')}
              </div>
            </fieldset>
            <fieldset class="s-rsvp__field">
              <legend class="s-rsvp__description">Что предпочитаете из напитков? Можно выбрать несколько вариантов</legend>
              <div class="s-rsvp__options">
                ${choice('checkbox', 'drinks', 'white-wine', 'вино белое', true)}
                ${choice('checkbox', 'drinks', 'red-wine', 'вино красное')}
                ${choice('checkbox', 'drinks', 'whiskey', 'виски')}
                ${choice('checkbox', 'drinks', 'vodka', 'водка')}
                ${choice('checkbox', 'drinks', 'champagne', 'шампанское')}
                ${choice('checkbox', 'drinks', 'soft', 'что-то безалкогольное')}
              </div>
            </fieldset>
            <fieldset class="s-rsvp__field">
              <legend class="s-rsvp__description">Что предпочитаете из меню? можно выбрать несколько вариантов</legend>
              <div class="s-rsvp__options">
                ${choice('checkbox', 'menu', 'meat', 'мясо', true)}
                ${choice('checkbox', 'menu', 'fish', 'рыба')}
                ${choice('checkbox', 'menu', 'veg', 'вегетерианское')}
                ${choice('checkbox', 'menu', 'gluten-free', 'без глютена')}
              </div>
            </fieldset>
            <p class="s-rsvp__hint" data-rsvp-hint role="status"></p>
            <button type="submit" class="s-rsvp__btn">отправить</button>
          </form>
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

// id узла документа → безопасный кусок HTML-id и фрагмента ссылки: всё, кроме
// латиницы, цифр, дефиса и подчёркивания, схлопывается в дефис.
function slug(s: string): string {
    return s.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function escAttr(s: string): string {
    return esc(s).replace(/"/g, '&quot;');
}

function choice(
    type: 'radio' | 'checkbox',
    name: string,
    value: string,
    label: string,
    checked = false,
): string {
    const modifier =
        type === 'radio'
            ? 's-rsvp__control--radio'
            : 's-rsvp__control--checkbox';

    return `<label class="s-rsvp__choice">
      <input class="s-rsvp__choice-input" type="${type}" name="${escAttr(name)}" value="${escAttr(value)}"${checked ? ' checked' : ''} />
      <span class="s-rsvp__control ${modifier}" aria-hidden="true"></span>
      <span>${esc(label)}</span>
    </label>`;
}

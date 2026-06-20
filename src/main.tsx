import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Точка входа React-оболочки. На Фазе 0 это лишь заглушка —
// полноценный редактор появится на Фазе 1 (см. roadmap, STUDIO-008).
const root = document.getElementById('root');
if (!root) {
  throw new Error('Не найден корневой элемент #root');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

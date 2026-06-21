/** Точка входа спайка-редактора на Craft.js (STUDIO-008). Вне прод-сборки. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

const root = document.getElementById('root');
if (!root) {
    throw new Error('Не найден корневой элемент #root');
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

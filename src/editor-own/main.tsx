import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorOwn } from './EditorOwn';

// Точка входа собственного редактора (STUDIO-032). Puck-версия живёт в src/main.tsx
// и остаётся дефолтом до паритета (STUDIO-035).
const root = document.getElementById('root');

if (!root) {
    throw new Error('Не найден корневой элемент #root');
}

createRoot(root).render(
    <StrictMode>
        <EditorOwn />
    </StrictMode>,
);

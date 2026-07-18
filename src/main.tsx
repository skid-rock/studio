import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorOwn } from './editor/EditorOwn';

// Точка входа: собственный редактор — единственный (STUDIO-035, ADR-0005).
const root = document.getElementById('root');

if (!root) {
    throw new Error('Не найден корневой элемент #root');
}

createRoot(root).render(
    <StrictMode>
        <EditorOwn />
    </StrictMode>,
);

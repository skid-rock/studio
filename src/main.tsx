import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './editor/Editor';

// Точка входа React-оболочки. Фаза 1: монтируем визуальный редактор (STUDIO-010).
const root = document.getElementById('root');
if (!root) {
  throw new Error('Не найден корневой элемент #root');
}

createRoot(root).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
);

/**
 * СПАЙК (STUDIO-008) — палитра (Toolbox) из registry.list().
 * Каждая кнопка через connectors.create становится источником DnD: перетаскивание
 * в холст создаёт новый узел соответствующего типа с дефолтными props.
 *
 * В Puck палитра шла из коробки (часть <Puck>); здесь её каркас пишется руками.
 */
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { useEditor } from '@craftjs/core';

import type { BlockRegistry } from '../../src/render-core/registry';
import type { BlockComponent } from './craft-adapter';
import { toCraftType } from './craft-adapter';

export interface ToolboxProps {
    registry: BlockRegistry;
    resolver: Record<string, BlockComponent>;
}

export function Toolbox({ registry, resolver }: ToolboxProps): ReactElement {
    const { connectors } = useEditor();

    return createElement(
        'div',
        { className: 'cf-toolbox' },
        createElement('h3', { className: 'cf-group-title' }, 'Блоки'),
        registry.list().map((mod) => {
            const Component = resolver[toCraftType(mod.type)];
            return createElement(
                'button',
                {
                    key: mod.type,
                    type: 'button',
                    className: 'cf-toolbox-item',
                    // ref-connector: перетащить кнопку → создать узел этого типа в холсте
                    ref: (ref: HTMLButtonElement | null) => {
                        if (ref) {
                            connectors.create(
                                ref,
                                createElement(Component, { ...mod.defaults }),
                            );
                        }
                    },
                },
                mod.label,
            );
        }),
    );
}

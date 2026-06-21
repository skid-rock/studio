import { createElement, memo } from "react";
import type { ReactElement } from "react";

import type { StudioDocument } from "../render-core/document";
import type { BlockModule } from "../render-core/types";
import { useEditorDoc } from "./editor-doc";
import { renderModuleHtml } from "./render-block-html";
import { samePuckProps } from "./same-puck-props";

export interface BlockPreviewProps {
  mod: BlockModule;
  props: Record<string, unknown>;
  doc: StudioDocument;
}

export function BlockPreview({ mod, props, doc }: BlockPreviewProps): ReactElement {
  const html = renderModuleHtml(mod, props, doc);
  // data-block + класс позволяют нейтрализовать position:fixed конверта в холсте
  // (см. Editor.tsx, .editor-block[data-block="intro/envelope"]).
  return createElement("div", {
    className: "editor-block",
    "data-block": mod.type,
    dangerouslySetInnerHTML: { __html: html },
  });
}

/**
 * Обёртка для Puck ComponentConfig: doc из контекста, без ref/getDoc в makeConfig.
 *
 * Мемоизирована (STUDIO-012): правка props одной секции не должна перерисовывать
 * соседние (challenges §6). doc из контекста стабилен по глобальным полям
 * (см. Editor.tsx), поэтому в сравнение не входит; смена темы перерисует все блоки
 * через контекст в обход memo — это намеренно.
 */
export const PuckBlockPreview = memo(
  function PuckBlockPreview({
    mod,
    props,
  }: {
    mod: BlockModule;
    props: Record<string, unknown>;
  }): ReactElement {
    const doc = useEditorDoc();
    return createElement(BlockPreview, { mod, props, doc });
  },
  (prev, next) => prev.mod === next.mod && samePuckProps(prev.props, next.props),
);

import type { BlockModule } from "./types";

// Реестр гетерогенный — хранит модули с разными типами props. Узко-типизированный
// BlockModule<P> не присваивается BlockModule<Record<string,unknown>> из-за
// контравариантности render и ковариантности defaults; единый супертип здесь — `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBlockModule = BlockModule<any>;

export interface BlockRegistry {
  register(module: AnyBlockModule): void;
  get(type: string): BlockModule | undefined;
  list(): BlockModule[];
}

export function createRegistry(modules: readonly AnyBlockModule[] = []): BlockRegistry {
  const map = new Map<string, BlockModule>();
  for (const m of modules) {
    map.set(m.type, m);
  }
  return {
    register(m) {
      map.set(m.type, m);
    },
    get(type) {
      return map.get(type);
    },
    list() {
      return [...map.values()];
    },
  };
}

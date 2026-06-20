import type { BlockModule } from "./types";

export interface BlockRegistry {
  register(module: BlockModule): void;
  get(type: string): BlockModule | undefined;
  list(): BlockModule[];
}

export function createRegistry(modules: BlockModule[] = []): BlockRegistry {
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

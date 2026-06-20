/**
 * Реестр секций по умолчанию для демо и экспорта Фазы 0.
 * Wiring живёт в sections/, не в render-core (ядро остаётся агностичным).
 */
import { createRegistry } from "../render-core/registry";
import { closingModule } from "./closing";
import { envelopeModule } from "./intro-envelope";
import { heroModule } from "./hero";

export const defaultRegistry = createRegistry([envelopeModule, heroModule, closingModule]);

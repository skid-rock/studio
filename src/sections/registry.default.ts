/**
 * Реестр секций по умолчанию для демо и экспорта Фазы 0.
 * Wiring живёт в sections/, не в render-core (ядро остаётся агностичным).
 */
import { createRegistry, defineBlock } from "../render-core/registry";
import { closingModule } from "./closing";
import { envelopeModule } from "./intro-envelope";
import { heroModule } from "./hero";

// defineBlock — единственная точка стирания P (вариант D, IMP-001): узкий модуль →
// стёртый BlockModule с рантайм-парсером props по его schema.
export const defaultRegistry = createRegistry([
  defineBlock(envelopeModule),
  defineBlock(heroModule),
  defineBlock(closingModule),
]);

/**
 * Реестр секций по умолчанию для демо и экспорта Фазы 0.
 * Wiring живёт в sections/, не в render-core (ядро остаётся агностичным).
 */
import { createRegistry, defineBlock } from '../render-core/registry';
import { closingModule } from './closing';
import { countdownModule } from './countdown';
import { dressCodeModule } from './dress-code';
import { dressCodePearlsModule } from './dress-code-pearls';
import { faqModule } from './details-faq';
import { envelopeModule } from './intro-envelope';
import { heroModule } from './hero';
import { rsvpModule } from './rsvp';
import { scheduleModule } from './schedule';
import { storyModule } from './our-story';
import { venueModule } from './venue';

// defineBlock — единственная точка стирания P (вариант D, IMP-001): узкий модуль →
// стёртый BlockModule с рантайм-парсером props по его schema.
export const defaultRegistry = createRegistry([
    defineBlock(envelopeModule),
    defineBlock(heroModule),
    defineBlock(storyModule),
    defineBlock(scheduleModule),
    defineBlock(countdownModule),
    defineBlock(venueModule),
    defineBlock(dressCodeModule),
    defineBlock(dressCodePearlsModule),
    defineBlock(faqModule),
    defineBlock(rsvpModule),
    defineBlock(closingModule),
]);

import type { CombatId } from './types';
import type { CombatService } from './CombatService';

export function createCombatCommands(combatService: CombatService) {
    return {
        startCombat: (combatId: CombatId, payload?: any) => combatService.startCombat(combatId, payload),
        endCombat: (combatId: CombatId) => combatService.endCombat(combatId),
        publishUpdate: (combatId: CombatId, dto: any) => combatService.publishUpdate(combatId, dto),
    };
}

export type CombatCommands = ReturnType<typeof createCombatCommands>;

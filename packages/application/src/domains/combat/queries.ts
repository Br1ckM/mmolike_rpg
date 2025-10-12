import type { CombatService } from './CombatService';

export function createCombatQueries(combatService: CombatService) {
    return {
        getCombatState: (combatId: string) => combatService.getCombatState(combatId),
        subscribe: (combatId: string, cb: (dto: any) => void) => {
            const handler = (dto: any) => cb(dto);
            const topic = 'combat.updated';
            combatService.on(topic, handler);
            return () => combatService.off(topic, handler);
        },
    };
}

export type CombatQueries = ReturnType<typeof createCombatQueries>;

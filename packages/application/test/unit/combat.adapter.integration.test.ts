import { describe, it, expect } from 'vitest';
import { CombatService } from '../../src/domains/combat/CombatService';
import { createCombatCommands } from '../../src/domains/combat/commands';
import { createCombatQueries } from '../../src/domains/combat/queries';

describe('Combat adapters integration', () => {
    it('commands and queries integrate with CombatService', () => {
        const svc = new CombatService();
        const commands = createCombatCommands(svc);
        const queries = createCombatQueries(svc);

        const events: any[] = [];
        const unsub = queries.subscribe('c1', (d: any) => events.push(d));

        expect(queries.getCombatState('c1')).toBeNull();

        const dto = commands.startCombat('c1', { combatants: [{ id: 1, name: 'Bob' }] });
        expect(dto.combatEntityId).toBe('c1');
        expect(queries.getCombatState('c1')).toEqual(dto);

        // ensure subscription received at least one update
        expect(events.length).toBeGreaterThanOrEqual(1);
        unsub();
    });
});

import { describe, it, expect } from 'vitest';
import { CombatService } from '../../src/domains/combat/CombatService';

describe('Combat scaffold (minimal)', () => {
    it('getCombatState returns null when unknown', () => {
        const svc = new CombatService();
        const state = svc.getCombatState('missing');
        expect(state).toBeNull();
    });

    it('startCombat creates and emits events', () => {
        const svc = new CombatService();
        const events: any[] = [];
        svc.on('combat.started', (d: any) => events.push(['started', d]));
        svc.on('combat.updated', (d: any) => events.push(['updated', d]));

        const dto = svc.startCombat('c1', { combatants: [{ id: 1, name: 'Alice' }] });
        expect(dto).toBeTruthy();
        expect(dto.combatEntityId).toBe('c1');
        expect(events.some(e => e[0] === 'started')).toBe(true);
        expect(events.some(e => e[0] === 'updated')).toBe(true);
    });
});

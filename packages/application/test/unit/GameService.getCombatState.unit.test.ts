import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '../../src/services/GameService';

function makeEntity(id: number, skillBook: any = null) {
    const entity: any = { id };
    if (skillBook) entity.SkillBookComponent = { knownSkills: skillBook };
    return entity;
}

function makeWorld(entities: any[]) {
    const map = new Map<number, any>();
    for (const e of entities) map.set(e.id, e);
    return { entities, getEntity: (id: number) => map.get(id) } as any;
}

describe('GameService.getCombatState (unit)', () => {
    let svc: GameService;

    beforeEach(() => {
        svc = new GameService();
    });

    it('returns null when there is no combat', async () => {
        (svc as any).world = makeWorld([]);
        const res = await (svc as any).getCombatState?.();
        expect(res).toBeNull();
    });

    it('hydrates combatants and skill book when combat present', async () => {
        // Build a fake combat entity that references two combatants
        const combatEntity = { id: 900, CombatComponent: { data: { combatants: ["10", "20"] } } } as any;

        // Create two combatant entities with skill book content IDs
        const combatant1 = makeEntity(10, ['skill_a']);
        const combatant2 = makeEntity(20, ['skill_b']);

        (svc as any).world = makeWorld([combatEntity, combatant1, combatant2]);

        // Map skill content IDs to numeric entity IDs and provide skill entities
        (svc as any).contentIdToEntityIdMap = new Map([['skill_a', 1001], ['skill_b', 1002]]);
        const skillEntityA = { id: 1001 } as any;
        const skillEntityB = { id: 1002 } as any;
        (svc as any).world = makeWorld([combatEntity, combatant1, combatant2, skillEntityA, skillEntityB]);

        // Provide minimal skill component accessors via test modules
        const SkillInfoComponent = { oneFrom: (e: any) => ({ data: { name: `Skill-${e.id}`, description: 'desc' } }) };
        const SkillComponent = { oneFrom: (e: any) => ({ data: { costs: [], effects: [{ target: 'Enemy' }] } }) };

        (svc as any)._testModules = {
            character: {
                InfoComponent: { oneFrom: () => null },
                SkillBookComponent: { oneFrom: (e: any) => e && e.SkillBookComponent ? { data: e.SkillBookComponent } : null },
            },
            skill: {
                SkillInfoComponent,
                SkillComponent,
            },
            combat: {
                CombatComponent: { oneFrom: (e: any) => e && e.CombatComponent ? { data: e.CombatComponent.data } : null }
            }
        };

        const res = await (svc as any).getCombatState?.();
        expect(res).not.toBeNull();
        expect(res.combatEntityId).toEqual('900');
        expect(Array.isArray(res.combatants)).toBe(true);
        expect(res.combatants.length).toEqual(2);
        // Skill hydration should have attached hydratedSkills onto SkillBookComponent
        expect(res.combatants[0].SkillBookComponent.hydratedSkills).toBeTruthy();
    });
});

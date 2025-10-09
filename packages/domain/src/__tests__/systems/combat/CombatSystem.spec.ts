import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupSystemTest } from '../../harness/setup';
import { CombatSystem } from '../../../ecs/systems/combat/CombatSystem';
import { Combat } from '../../../ecs/entities/combat';
import { CombatComponent, CombatantComponent } from '../../../ecs/components/combat';
import { HealthComponent, ManaComponent, DerivedStatsComponent } from '../../../ecs/components/character';

describe('CombatSystem', () => {
    let harness: ReturnType<typeof setupSystemTest>;

    beforeEach(() => {
        harness = setupSystemTest();
    });

    describe('Combat Flow & Turn Management', () => {
        it('should correctly sort the turn queue by initiative', () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 5, 100);
            const e2 = createCombatant('e2', 'team2', 'Front', 25, 100);

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id), String(e2.id)] } as any);
            world.addEntity(combatEntity);

            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id), String(e2.id)] });

            const combatComp = CombatComponent.oneFrom(combatEntity)!.data;
            expect(combatComp.turnQueue).toEqual([String(e2.id), String(p1.id), String(e1.id)]);
        });

        it('should advance to the next round after all combatants have acted', () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 100);
            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)], roundNumber: 1 } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });

            // Turn 1 (p1)
            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'MOVE_ROW' });
            // Turn 2 (e1) - this should trigger the next round
            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(e1.id), actionType: 'MOVE_ROW' });

            const combatComp = CombatComponent.oneFrom(combatEntity)!.data;
            expect(combatComp.roundNumber).toBe(2);
            expect(mockEventBus.emit).toHaveBeenCalledWith('roundStarted', expect.objectContaining({ roundNumber: 2 }));
        });

        it('should skip dead combatants in the turn order', () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 15, 0); // e1 is dead
            const e2 = createCombatant('e2', 'team2', 'Front', 10, 100);

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id), String(e2.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id), String(e2.id)] });

            // P1 takes their turn
            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'MOVE_ROW' });

            // Assert that the next turn started is for e2, skipping the dead e1
            expect(mockEventBus.emit).toHaveBeenCalledWith('turnStarted', expect.objectContaining({ activeCombatantId: String(e2.id) }));
        });
    });

    describe('Action & Effect Resolution', () => {
        it('should prevent an action if the actor cannot afford the resource cost', () => {
            const { world, mockEventBus, mockContent, createCombatant, createSkill } = harness;

            // 1. SETUP: Create a real skill with a mana cost
            createSkill('skill_fireball', {
                skill: { type: 'active', costs: [{ stat: 'mana', amount: 50 }], effects: [] }
            });

            const system = new CombatSystem(world, mockEventBus, mockContent, harness.mockContentIdToEntityIdMap);

            // 2. SETUP: Create an actor that has a ManaComponent but not enough mana
            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            p1.add(new ManaComponent({ current: 20, max: 50 })); // Has only 20 mana

            // 3. SETUP: Create a valid target
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 100);

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });

            // 4. ACT: Attempt to use the expensive skill
            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'SKILL', skillId: 'skill_fireball', targetId: String(e1.id) });

            // 5. ASSERT: Verify that no damage was dealt because the action was prevented
            expect(mockEventBus.emit).not.toHaveBeenCalledWith('damageDealt', expect.any(Object));
        });

        it('should reduce actor mana when a skill with a mana cost is used', () => {
            const { world, mockEventBus, mockContent, createCombatant, createSkill } = harness;
            createSkill('skill_frostbolt', { skill: { type: 'active', costs: [{ stat: 'mana', amount: 15 }], effects: [] } });
            const system = new CombatSystem(world, mockEventBus, mockContent, harness.mockContentIdToEntityIdMap);
            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const p1Mana = ManaComponent.oneFrom(p1)!;
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 100);
            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });

            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'SKILL', skillId: 'skill_frostbolt', targetId: String(e1.id) });

            expect(p1Mana.data.current).toBe(35);
        });

        it('should deal reduced damage to a back-row target if a front-row combatant exists', () => {
            const { world, mockEventBus, mockContent, createCombatant, createSkill } = harness;
            createSkill('skill_arrow_shot', { skill: { type: 'active', effects: [{ type: 'Damage', power: 20, scalingStat: 'attack', target: 'Enemy', targeting: { pattern: 'SINGLE' } }] } });
            const system = new CombatSystem(world, mockEventBus, mockContent, harness.mockContentIdToEntityIdMap);

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            DerivedStatsComponent.oneFrom(p1)!.data.attack = 10;

            const e1 = createCombatant('e1', 'team2', 'Front', 10, 100);
            const e2 = createCombatant('e2', 'team2', 'Back', 5, 100);
            const e2Health = HealthComponent.oneFrom(e2)!.data;

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id), String(e2.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id), String(e2.id)] });

            // Force the attack to always hit by mocking Math.random for this test
            const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

            try {
                system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'SKILL', skillId: 'skill_arrow_shot', targetId: String(e2.id) });
            } finally {
                randomSpy.mockRestore();
            }

            expect(e2Health.current).toBe(88);
        });

        it('should correctly apply a Heal effect', () => {
            const { world, mockEventBus, mockContent, createCombatant, createSkill } = harness;
            createSkill('skill_minor_heal', { skill: { type: 'active', effects: [{ type: 'Heal', power: 30, scalingStat: 'magicAttack', target: 'Ally', targeting: { pattern: 'SINGLE' } }] } });
            const system = new CombatSystem(world, mockEventBus, mockContent, harness.mockContentIdToEntityIdMap);

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            DerivedStatsComponent.oneFrom(p1)!.data.magicAttack = 10;
            const p2 = createCombatant('p2', 'team1', 'Front', 15, 100);
            HealthComponent.oneFrom(p2)!.data.current = 20;

            const combatEntity = new Combat({ combatants: [String(p1.id), String(p2.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(p2.id)] });

            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'SKILL', skillId: 'skill_minor_heal', targetId: String(p2.id) });

            expect(HealthComponent.oneFrom(p2)!.data.current).toBe(60);
        });

        it('should emit "effectApplied" for skills that apply effects', () => {
            const { world, mockEventBus, mockContent, createCombatant, createSkill } = harness;
            createSkill('skill_weaken', { skill: { type: 'active', effects: [{ type: 'ApplyEffect', effectId: 'effect_def_down', target: 'Enemy', power: 0, scalingStat: 'attack', targeting: { pattern: 'SINGLE' } }] } });
            const system = new CombatSystem(world, mockEventBus, mockContent, harness.mockContentIdToEntityIdMap);

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 100);
            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)] } as any);
            world.addEntity(combatEntity);

            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });
            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'SKILL', skillId: 'skill_weaken', targetId: String(e1.id) });

            expect(mockEventBus.emit).toHaveBeenCalledWith('effectApplied', {
                sourceId: String(p1.id),
                targetId: String(e1.id),
                effectId: 'effect_def_down'
            });
        });
    });

    describe('Fleeing', () => {
        it('should end combat with the opposing team as the winner when a player flees', () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 100);

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });

            system['onFleeAttempt']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id) });

            expect(mockEventBus.emit).toHaveBeenCalledWith('combatEnded', {
                combatEntityId: String(combatEntity.id),
                winningTeamId: 'team2'
            });
        });
    });

    describe('Win/Loss Conditions', () => {
        it('should end combat when all members of a team are defeated', () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 10);
            HealthComponent.oneFrom(p1)!.data.current = 100;

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });

            HealthComponent.oneFrom(e1)!.data.current = 0;

            system['onActionTaken']({ combatEntityId: String(combatEntity.id), actorId: String(p1.id), actionType: 'MOVE_ROW' });

            expect(mockEventBus.emit).toHaveBeenCalledWith('combatEnded', {
                combatEntityId: String(combatEntity.id),
                winningTeamId: 'team1'
            });
        });

        it("should emit 'enemyDefeated' for each defeated enemy upon victory", () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 0);
            const e2 = createCombatant('e2', 'team2', 'Front', 5, 0);

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id), String(e2.id)] } as any);
            world.addEntity(combatEntity);

            system['endCombat'](combatEntity, 'team1');

            expect(mockEventBus.emit).toHaveBeenCalledWith('enemyDefeated', expect.objectContaining({ enemyId: String(e1.id) }));
            expect(mockEventBus.emit).toHaveBeenCalledWith('enemyDefeated', expect.objectContaining({ enemyId: String(e2.id) }));
        });
    });
});
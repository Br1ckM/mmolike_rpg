import { describe, it, expect, beforeEach } from 'vitest';
import { setupSystemTest } from '../../harness/setup';
import { CombatSystem } from '../../../ecs/systems/combat/CombatSystem';
import { Combat } from '../../../ecs/entities/combat';
import { CombatComponent } from '../../../ecs/components/combat';
import { HealthComponent, ManaComponent } from '../../../ecs/components/character';

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

    describe('Action Resolution', () => {
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
    });

    describe('Win/Loss Conditions', () => {
        it('should end combat when all members of a team are defeated', () => {
            const { world, mockEventBus, mockContent, createCombatant } = harness;
            const system = new CombatSystem(world, mockEventBus, mockContent, new Map());

            const p1 = createCombatant('p1', 'team1', 'Front', 20, 100);
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 10); // Low health
            HealthComponent.oneFrom(p1)!.data.current = 100; // Ensure player is alive

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id)] } as any);
            world.addEntity(combatEntity);
            system['onCombatStarted']({ combatEntityId: String(combatEntity.id), combatants: [String(p1.id), String(e1.id)] });

            // Simulate lethal damage
            HealthComponent.oneFrom(e1)!.data.current = 0;

            // Any action will now trigger the end-of-combat check
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
            const e1 = createCombatant('e1', 'team2', 'Front', 10, 0); // Already dead
            const e2 = createCombatant('e2', 'team2', 'Front', 5, 0);  // Already dead

            const combatEntity = new Combat({ combatants: [String(p1.id), String(e1.id), String(e2.id)] } as any);
            world.addEntity(combatEntity);

            // This is a simplified call to the private endCombat method for a direct test
            system['endCombat'](combatEntity, 'team1');

            expect(mockEventBus.emit).toHaveBeenCalledWith('enemyDefeated', expect.objectContaining({ enemyId: String(e1.id) }));
            expect(mockEventBus.emit).toHaveBeenCalledWith('enemyDefeated', expect.objectContaining({ enemyId: String(e2.id) }));
        });
    });
});
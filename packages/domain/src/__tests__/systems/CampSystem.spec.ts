import { describe, it, expect, beforeEach } from 'vitest';
import { setupSystemTest } from '../harness/setup';
import { CampSystem } from '../../ecs/systems/CampSystem';
import { HealthComponent, ManaComponent } from '../../ecs/components/character';
import { CompanionComponent } from '../../ecs/components/npc';

describe('CampSystem', () => {
    let harness: ReturnType<typeof setupSystemTest>;

    beforeEach(() => {
        harness = setupSystemTest();
    });

    it('should restore the player\'s health and mana to full', () => {
        const { world, mockEventBus, player } = harness;
        const system = new CampSystem(world, mockEventBus);

        // Damage the player first
        const health = HealthComponent.oneFrom(player)!;
        const mana = ManaComponent.oneFrom(player)!;
        health.data.current = 10;
        mana.data.current = 5;

        // Act
        system['handleRest']({ characterId: player.id });

        // Assert
        expect(health.data.current).toBe(health.data.max);
        expect(mana.data.current).toBe(mana.data.max);
    });

    it('should restore health and mana for all active party members', () => {
        const { world, mockEventBus, player, createNpc } = harness;
        const system = new CampSystem(world, mockEventBus);

        // Create an active companion and damage them
        const companion = createNpc('npc_lenna', {
            info: { name: 'Lenna', race: 'Human', avatarUrl: '' },
            companion: { recruited: true, inActiveParty: true, affinity: 0, campDialogueTreeId: '' },
        } as any);
        const companionHealth = HealthComponent.oneFrom(companion)!;
        companionHealth.data.current = 15;

        // Damage the player as well
        HealthComponent.oneFrom(player)!.data.current = 20;

        // Act
        system['handleRest']({ characterId: player.id });

        // Assert
        expect(HealthComponent.oneFrom(player)!.data.current).toBe(HealthComponent.oneFrom(player)!.data.max);
        expect(companionHealth.data.current).toBe(companionHealth.data.max);
    });

    it('should NOT restore health for benched (inactive) companions', () => {
        const { world, mockEventBus, player, createNpc } = harness;
        const system = new CampSystem(world, mockEventBus);

        // Create a benched companion and damage them
        const benchedCompanion = createNpc('npc_kaelan', {
            info: { name: 'Kaelan', race: 'Elf', avatarUrl: '' },
            companion: { recruited: true, inActiveParty: false, affinity: 0, campDialogueTreeId: '' },
        } as any);
        const benchedHealth = HealthComponent.oneFrom(benchedCompanion)!;
        benchedHealth.data.current = 25;

        // Act
        system['handleRest']({ characterId: player.id });

        // Assert
        expect(benchedHealth.data.current).toBe(25); // Health should remain unchanged
    });

    it('should emit playerStateModified and a notification upon resting', () => {
        const { world, mockEventBus, player } = harness;
        const system = new CampSystem(world, mockEventBus);

        // Act
        system['handleRest']({ characterId: player.id });

        // Assert
        expect(mockEventBus.emit).toHaveBeenCalledWith('playerStateModified', {
            characterId: player.id
        });
        expect(mockEventBus.emit).toHaveBeenCalledWith('notification', {
            type: 'success',
            message: 'Your party feels well-rested.'
        });
    });
});
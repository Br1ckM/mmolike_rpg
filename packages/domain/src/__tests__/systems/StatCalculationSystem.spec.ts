import { describe, it, expect, beforeEach } from 'vitest';
import { setupSystemTest } from '../harness/setup';
import { StatCalculationSystem } from '../../ecs/systems/StatCalculationSystem';
import { Character, CharacterEntityData } from '../../ecs/entities/character';
import { Entity } from 'ecs-lib'
import {
    CoreStatsComponent,
    DerivedStatsComponent,
    HealthComponent,
    ManaComponent,
    EquipmentComponent,
    EquipmentData,
    InfoComponent
} from '../../ecs/components/character';
import { ActiveEffectComponent } from '../../ecs/components/combat';

// A helper type to make nested properties partial for our test data
type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

const defaultEquipment: EquipmentData = {
    helm: null, cape: null, amulet: null, armor: null, belt: null, gloves: null,
    mainHand: null, offHand: null, ring1: null, ring2: null, boots: null,
    charm1: null, charm2: null, charm3: null,
};

describe('StatCalculationSystem', () => {
    let harness: ReturnType<typeof setupSystemTest>;

    beforeEach(() => {
        harness = setupSystemTest();
    });

    // --- FIX #1: Use a more flexible 'DeepPartial' type for the input data ---
    const createTestCharacter = (data: DeepPartial<CharacterEntityData>) => {
        const characterData: CharacterEntityData = {
            info: { name: 'TestChar', race: 'Human', avatarUrl: '' },
            coreStats: { strength: 0, dexterity: 0, intelligence: 0 },
            derivedStats: {},
            equipment: { ...defaultEquipment, ...data.equipment },
            ...data,
        } as CharacterEntityData;

        const char = new Character(characterData);
        harness.world.addEntity(char);
        return char;
    };

    it('should calculate base derived stats from core stats', () => {
        const { world, mockEventBus, mockContent } = harness;
        const character = createTestCharacter({ coreStats: { strength: 10, dexterity: 8, intelligence: 5 } });
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);

        const derived = DerivedStatsComponent.oneFrom(character)!.data;
        expect(derived.attack).toBe(20); // 10 STR * 2
        expect(derived.defense).toBe(8);  // 8 DEX * 1
        expect(derived.magicAttack).toBe(10); // 5 INT * 2
    });

    it('should correctly apply ancestry modifiers', () => {
        const { world, mockEventBus, mockContent } = harness;
        const character = createTestCharacter({
            coreStats: { strength: 10, dexterity: 10, intelligence: 10 },
            info: { name: 'Test Dwarf', race: 'Dwarf', avatarUrl: '', ancestryId: 'ancestry_dwarf' }
        });
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);

        const health = HealthComponent.oneFrom(character)!.data;
        expect(health.max).toBe(120); // Base 10 STR + 2 from Dwarf = 12 STR. 12 * 10 = 120 HP.
    });

    it('should add stats from a single piece of equipped gear', () => {
        const { world, mockEventBus, mockContent, createItem } = harness;
        const sword = createItem('item_sword', { equipable: { baseStats: { attack: 15 } } } as any);
        const character = createTestCharacter({
            coreStats: { strength: 10, dexterity: 10, intelligence: 10 },
            equipment: { mainHand: String(sword.id) }
        });
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);

        const derived = DerivedStatsComponent.oneFrom(character)!.data;
        expect(derived.attack).toBe(35);
    });

    it('should correctly sum stats from multiple pieces of gear', () => {
        const { world, mockEventBus, mockContent, createItem } = harness;
        const sword = createItem('item_sword', { equipable: { baseStats: { attack: 15 } } } as any);
        const shield = createItem('item_shield', { equipable: { baseStats: { defense: 20 } } } as any);
        const character = createTestCharacter({
            coreStats: { strength: 10, dexterity: 10, intelligence: 10 },
            equipment: { mainHand: String(sword.id), offHand: String(shield.id) }
        });
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);

        const derived = DerivedStatsComponent.oneFrom(character)!.data;
        expect(derived.attack).toBe(35);
        expect(derived.defense).toBe(30);
    });

    it('should apply a percentage-based buff from an active effect', () => {
        const { world, mockEventBus, mockContent, createEffect } = harness;
        createEffect('effect_attack_up', { statModifier: { stat: 'attack', value: 0.10, valueType: 'PERCENT' } });
        const character = createTestCharacter({ coreStats: { strength: 10, dexterity: 10, intelligence: 10 } });
        character.add(new ActiveEffectComponent([{ effectId: 'effect_attack_up', durationInTurns: 3 } as any]));
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);

        const derived = DerivedStatsComponent.oneFrom(character)!.data;
        expect(derived.attack).toBe(22); // Base 20 (from 10 STR) * 1.10 = 22
    });

    it('should stack multiple flat and percentage effects correctly', () => {
        const { world, mockEventBus, mockContent, createEffect } = harness;
        createEffect('effect_attack_up', { statModifier: { stat: 'attack', value: 0.10, valueType: 'PERCENT' } });
        createEffect('effect_sword_blessing', { statModifier: { stat: 'attack', value: 5, valueType: 'FLAT' } });
        const character = createTestCharacter({ coreStats: { strength: 10, dexterity: 10, intelligence: 10 } });
        character.add(new ActiveEffectComponent([
            { effectId: 'effect_attack_up', durationInTurns: 3 },
            { effectId: 'effect_sword_blessing', durationInTurns: 2 }
        ] as any));
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);

        const derived = DerivedStatsComponent.oneFrom(character)!.data;
        expect(derived.attack).toBe(28); // Base 20 (from 10 STR) + 5 flat = 25. Then 25 * 1.10 = 27.5, rounded to 28.
    });

    it('should not crash if a character has no CoreStatsComponent', () => {
        const { world, mockEventBus, mockContent } = harness;
        const character = createTestCharacter({});
        character.remove(CoreStatsComponent.oneFrom(character)!);

        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        expect(() => system.update(character)).not.toThrow();
    });

    it('should clamp current health to the new max when stats are recalculated', () => {
        const { world, mockEventBus, mockContent } = harness;
        const character = createTestCharacter({ coreStats: { strength: 10, dexterity: 10, intelligence: 10 } });
        const system = new StatCalculationSystem(world, mockEventBus, mockContent);

        system.update(character);
        const health = HealthComponent.oneFrom(character)!.data;
        expect(health.max).toBe(100);
        expect(health.current).toBe(100);

        health.current = 50;

        CoreStatsComponent.oneFrom(character)!.data.strength = 5;
        system.update(character);

        expect(health.max).toBe(50);
        expect(health.current).toBe(50);
    });
});
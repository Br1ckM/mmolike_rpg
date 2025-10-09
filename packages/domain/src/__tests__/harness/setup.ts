import { vi, Mock } from 'vitest';
import ECS, { Entity } from 'ecs-lib';
import { EventBus } from '../../ecs/EventBus';
import { NPC, NPCEntityData } from '../../ecs/entities/npc';
import { Location, LocationEntityData } from '../../ecs/entities/world';
import { Character, CharacterEntityData } from '../../ecs/entities/character';
import { Skill, SkillEntityData } from '../../ecs/entities/skill'
import { Item, ItemData } from '../../ecs/entities/item';
import { Effect } from '../../ecs/entities/effects';
import { CoreStatsComponent, HealthComponent, } from '../../ecs/components/character'
import { CombatantComponent } from '../../ecs/components/combat'

export type MockedEventBus = EventBus & {
    on: Mock;
    emit: Mock;
};

export function setupSystemTest() {
    const world = new ECS();

    const mockEventBus = {
        on: vi.fn(),
        emit: vi.fn(),
        listeners: {},
    };

    const mockContentIdToEntityIdMap = new Map<string, number>();

    // --- NEW: Mock Content Data ---
    const mockContent = {
        ancestries: new Map([
            ['ancestry_dwarf', { statModifiers: { strength: 2, dexterity: 0, intelligence: -1 } }]
        ]),
        effects: new Map(),
        config: {
            stat_scalings: {
                attack_from_strength: 2,
                magic_attack_from_intelligence: 2,
                defense_from_dexterity: 1,
                magic_resist_from_intelligence: 1,
                dodge_from_dexterity: 0.5,
                health_from_strength: 10,
                mana_from_intelligence: 5
            },
            base_stats: {
                crit_chance: 5,
                crit_damage: 150,
                speed: 100,
                accuracy: 90
            }
        }
    };

    const createNpc = (id: string, data: NPCEntityData) => {
        data.info.id = id;
        const npc = new NPC(data);
        world.addEntity(npc);
        mockContentIdToEntityIdMap.set(id, npc.id);
        return npc;
    };

    const createLocation = (id: string, data: LocationEntityData) => {
        const location = new Location(data);
        world.addEntity(location);
        mockContentIdToEntityIdMap.set(id, location.id);
        return location;
    };

    // --- NEW: Helpers for creating Items and Effects ---
    const createItem = (id: string, data: ItemData) => {
        const item = new Item(data);
        world.addEntity(item);
        mockContentIdToEntityIdMap.set(id, item.id);
        return item;
    };

    const createEffect = (id: string, data: any) => {
        const effect = new Effect(data);
        world.addEntity(effect);
        mockContent.effects.set(id, effect); // Add to our mock content map
        return effect;
    };

    // --- NEW: Helper to create a combat-ready character ---
    const createCombatant = (id: string, teamId: string, row: 'Front' | 'Back', initiative: number, health: number) => {
        const combatant = new Character({
            info: { id, name: id, race: 'Test', avatarUrl: '' },
            coreStats: { strength: 10, dexterity: 10, intelligence: 10 },
            derivedStats: {},
            // Pass health directly into the constructor data
            health: { current: health, max: health },
        } as CharacterEntityData);

        // The CombatantComponent is added after construction, which is correct.
        combatant.add(new CombatantComponent({ teamId, row, initiative, hasTakenAction: false }));
        world.addEntity(combatant);
        mockContentIdToEntityIdMap.set(id, combatant.id);

        return combatant;
    };

    const createSkill = (id: string, data: Partial<SkillEntityData>) => {
        const skill = new Skill({
            info: { name: id, description: '' },
            skill: { type: 'active', effects: [] },
            ...data,
        } as SkillEntityData);
        world.addEntity(skill);
        mockContent.skills.set(id, skill); // Add to our mock content map
        mockContentIdToEntityIdMap.set(id, skill.id);
        return skill;
    };

    const player = new Character({
        info: { name: 'Player', race: 'Human', avatarUrl: '' },
        controllable: { isPlayer: true },
        derivedStats: {},
    } as any);
    world.addEntity(player);

    return {
        world,
        mockEventBus: mockEventBus as unknown as MockedEventBus,
        mockContentIdToEntityIdMap,
        mockContent, // <-- Expose mock content
        player,
        createNpc,
        createLocation,
        createItem, // <-- Expose new helpers
        createEffect,
        createCombatant,
        createSkill,
    };
}
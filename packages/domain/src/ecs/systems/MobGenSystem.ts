import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { Character, type CharacterData } from '../entities/character';
import {
    type MobTierData,
    type MobArchetypeData,
    type MobFamilyData,
    MobComponent,
    LootTableComponent,
    ActiveTraitsComponent,
} from '../components/mob';
import { AIProfileComponent } from '../components/combat';
import { StatCalculationSystem } from './StatCalculationSystem';
import { InfoComponent } from '../components/character';

interface MobTemplate {
    id: string;
    name: string;
    level: number;
    familyId: string;
    tierId: MobTierData['id'];
    archIds: string[];
    skills: string[];
    uniqueLoot?: string[];
    statOverrides?: { [stat: string]: number };
}

export class MobGenSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: {
        mobs: Map<string, MobTemplate>;
        families: Map<string, MobFamilyData>;
        tiers: Map<string, MobTierData>;
        archetypes: Map<string, MobArchetypeData>;
    };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;
    }

    public generateMob(protoId: string): Character | null {
        // 1) Look up blueprints
        const mobTemplate = this.content.mobs.get(protoId);
        if (!mobTemplate) {
            console.error(`MobGenSystem: Could not find mob template for PROTO_ID: ${protoId}`);
            return null;
        }

        const family = this.content.families.get(mobTemplate.familyId);
        const tier = this.content.tiers.get(mobTemplate.tierId);
        const archetypes = mobTemplate.archIds
            .map(id => this.content.archetypes.get(id))
            .filter((arch): arch is MobArchetypeData => !!arch);

        if (!family || !tier || archetypes.some(a => !a)) {
            console.error(`MobGenSystem: Missing family, tier, or archetype data for ${protoId}.`);
            return null;
        }

        // 2) Stat point budget
        const statPointBudget = (mobTemplate.level * 10) * tier.statPointMultiplier;

        // 3) Allocation from archetypes
        let finalAllocation: [number, number, number] = [0, 0, 0];
        for (const arch of archetypes) {
            finalAllocation[0] += arch.allocation[0];
            finalAllocation[1] += arch.allocation[1];
            finalAllocation[2] += arch.allocation[2];
        }
        finalAllocation = finalAllocation.map(v => v / archetypes.length) as typeof finalAllocation;

        // 4) Distribute budget
        let distributedStats = {
            strength: statPointBudget * finalAllocation[0],
            dexterity: statPointBudget * finalAllocation[1],
            intelligence: statPointBudget * finalAllocation[2],
        };

        // 5) Family boost
        distributedStats.strength *= (1 + family.boosts[0]);
        distributedStats.dexterity *= (1 + family.boosts[1]);
        distributedStats.intelligence *= (1 + family.boosts[2]);

        let finalStats = {
            strength: Math.round(distributedStats.strength),
            dexterity: Math.round(distributedStats.dexterity),
            intelligence: Math.round(distributedStats.intelligence),
        };

        // 6) Manual overrides
        if (mobTemplate.statOverrides) {
            Object.assign(finalStats, mobTemplate.statOverrides);
        }

        // 7) Loot & traits
        const finalLootTable = [...family.lootPools, ...(mobTemplate.uniqueLoot || [])];
        const finalTraits = [...(family.traits || []), ...(tier.traits || [])];

        // 8) Assemble CharacterData
        const mobCharacterData: CharacterData = {
            info: {
                name: `${tier.name} ${mobTemplate.name}`,
                race: family.id,
                avatarUrl: '',
            },
            controllable: { isPlayer: false },
            coreStats: finalStats,

            // Derived stats no longer include health/mana
            derivedStats: {
                attack: 0,
                magicAttack: 0,
                defense: 0,
                magicResist: 0,
                critChance: 0,
                critDamage: 0,
                dodge: 0,
                haste: 0,
                accuracy: 0,
            },

            // Seed resource components. StatCalculationSystem will set proper max/current.
            health: { current: 1, max: 1 },
            mana: { current: 1, max: 1 },

            jobs: { activeJobId: 'mob', jobList: [] },
            equipment: {
                helm: null, cape: null, amulet: null, armor: null, belt: null, gloves: null,
                mainHand: null, offHand: null, ring1: null, ring2: null, boots: null,
                charm1: null, charm2: null, charm3: null
            },
            skillBook: { knownSkills: mobTemplate.skills },
        };

        const mobEntity = new Character(mobCharacterData);

        // 9) Attach mob-specific components
        mobEntity.add(new MobComponent({
            protoId,
            familyId: family.id,
            tier: tier.id,
            archetypes: archetypes.map(a => a.id),
        }));

        mobEntity.add(new LootTableComponent({ tableIds: finalLootTable }));
        if (finalTraits.length > 0) {
            mobEntity.add(new ActiveTraitsComponent({ traitIds: finalTraits }));
        }

        // AI from first archetype
        mobEntity.add(new AIProfileComponent({ profile: archetypes[0].aiProfile }));

        // 10) Finalize: compute derived & capacities (pass archetypes so their modifiers apply)
        const statCalculator = new StatCalculationSystem(this.world, this.eventBus, this.content);
        statCalculator.update(mobEntity, archetypes);

        const info = InfoComponent.oneFrom(mobEntity);
        if (info) {
            console.log(`Generated Mob: ${info.data.name} (Lvl ${mobTemplate.level})`);
        }
        return mobEntity;
    }
}

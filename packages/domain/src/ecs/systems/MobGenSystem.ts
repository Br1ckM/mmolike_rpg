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
import { HealthComponent, SkillBookComponent, InfoComponent } from '../components/character';

// A temporary interface for the mob template data from your master table.
// In a real implementation, this would be defined with your other content types.
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

/**
 * A factory system responsible for generating mob entities.
 * It does not listen to events; its public method is called directly
 * by other systems (like the EncounterSystem).
 */
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

    /**
     * The core factory method. Creates and returns a single mob entity.
     * @param protoId The unique ID of the mob to generate (e.g., "WLF-901").
     * @returns A fully constructed Character entity, or null if generation fails.
     */
    public generateMob(protoId: string): Character | null {
        // 1. --- SETUP: Gather all data blueprints ---
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

        // 2. --- STATS STEP 1: Calculate the Total Stat Point Budget ---
        const statPointBudget = (mobTemplate.level * 10) * tier.statPointMultiplier;

        // 3. --- STATS STEP 2: Determine Stat Allocation from Archetypes ---
        let finalAllocation = [0, 0, 0];
        for (const arch of archetypes) {
            finalAllocation[0] += arch.allocation[0];
            finalAllocation[1] += arch.allocation[1];
            finalAllocation[2] += arch.allocation[2];
        }
        finalAllocation = finalAllocation.map(val => val / archetypes.length);

        // 4. --- STATS STEP 3: Distribute the Budget ---
        let distributedStats = {
            strength: statPointBudget * finalAllocation[0],
            dexterity: statPointBudget * finalAllocation[1],
            intelligence: statPointBudget * finalAllocation[2],
        };

        // 5. --- STATS STEP 4: Apply the Family Boost ---
        distributedStats.strength *= (1 + family.boosts[0]);
        distributedStats.dexterity *= (1 + family.boosts[1]);
        distributedStats.intelligence *= (1 + family.boosts[2]);

        let finalStats = {
            strength: Math.round(distributedStats.strength),
            dexterity: Math.round(distributedStats.dexterity),
            intelligence: Math.round(distributedStats.intelligence),
        };

        // 6. --- STATS STEP 5: Apply Manual Overrides ---
        if (mobTemplate.statOverrides) {
            Object.assign(finalStats, mobTemplate.statOverrides);
        }

        // 7. --- LOOT & TRAITS: Combine from all sources ---
        const finalLootTable = [...family.lootPools, ...(mobTemplate.uniqueLoot || [])];
        const finalTraits = [...(family.traits || []), ...(tier.traits || [])];

        // 8. --- FINAL ASSEMBLY: Create the Character entity ---
        const mobCharacterData: CharacterData = {
            info: {
                name: `${tier.name} ${mobTemplate.name}`,
                race: family.id,
                avatarUrl: '', // Placeholder
            },
            controllable: { isPlayer: false },
            coreStats: finalStats,
            derivedStats: { health: 0, mana: 0, attack: 0, magicAttack: 0, defense: 0, magicResist: 0, critChance: 0, critDamage: 0, dodge: 0, haste: 0, accuracy: 0 },
            health: { current: 1, max: 1 }, // Will be set by StatCalculationSystem
            jobs: { activeJobId: 'mob', jobList: [] },
            equipment: { helm: null, cape: null, amulet: null, armor: null, belt: null, gloves: null, mainHand: null, offHand: null, ring1: null, ring2: null, boots: null, charm1: null, charm2: null, charm3: null },
            skillBook: { knownSkills: mobTemplate.skills },
        };

        const mobEntity = new Character(mobCharacterData);

        // 9. --- ADD COMPONENTS ---
        mobEntity.add(new MobComponent({
            protoId: protoId,
            familyId: family.id,
            tier: tier.id,
            archetypes: archetypes.map(a => a.id),
        }));

        mobEntity.add(new LootTableComponent({ tableIds: finalLootTable }));
        if (finalTraits.length > 0) {
            mobEntity.add(new ActiveTraitsComponent({ traitIds: finalTraits }));
        }

        // Use the first archetype's AI profile as the primary
        mobEntity.add(new AIProfileComponent({ profile: archetypes[0].aiProfile }));

        // 10. --- CALCULATE DERIVED STATS ---
        // This is a crucial final step to ensure the mob's stats are combat-ready.
        const statCalculator = new StatCalculationSystem(this.world, this.eventBus, this.content);
        statCalculator.update(mobEntity);

        const info = InfoComponent.oneFrom(mobEntity);
        if (info) {
            console.log(`Generated Mob: ${info.data.name} (Lvl ${mobTemplate.level})`);
        }
        return mobEntity;
    }
}
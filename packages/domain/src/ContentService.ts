// packages/domain/src/ContentService.ts

import type { MobFamilyData, MobTierData, MobArchetypeData } from './ecs/components/mob';
import type { TraitData } from './ecs/components/traits';
import type { LocationEntityData, NodeEntityData } from './ecs/entities/world';
import type { NPCEntityData } from './ecs/entities/npc';
import type { DialogueTree } from './ecs/components/dialogue';
import type { QuestEntityData } from './ecs/entities/quest';
import type { SkillEntityData } from './ecs/entities/skill';
import type { EffectDefinitionData } from './ecs/components/effects';
import type { JobEntityData } from './ecs/entities/job';

interface ContentTemplate<T> {
    id: string;
    components: T;
}

export interface RarityAffixConfig {
    prefixes: number | [number, number];
    suffixes: number | [number, number];
    total_max: number;
}

export interface GameConfig {
    stat_scalings: { [key: string]: number };
    base_stats: { [key: string]: number };
    damage_formula: { [key: string]: number };
    mob_generation: { [key: string]: number };
    rarity_chances: { [key: string]: number };
    rarity_affixes: { [key: string]: RarityAffixConfig };
    player_progression: PlayerProgressionConfig;
}

// This interface now correctly defines the shape of the parsed content maps.
export interface GameContent {
    mobs: Map<string, any>;
    families: Map<string, MobFamilyData>;
    tiers: Map<string, MobTierData>;
    archetypes: Map<string, MobArchetypeData>;
    traits: Map<string, TraitData>;
    encounters: Map<string, any>;
    affixes: Map<string, any>;
    baseItems: Map<string, any>;
    locations: Map<string, LocationEntityData>;
    quests: Map<string, ContentTemplate<QuestEntityData>>;
    dialogueTrees: Map<string, DialogueTree>;
    nodes: Map<string, ContentTemplate<NodeEntityData>>;
    lootTables: Map<string, any>;
    skills: Map<string, ContentTemplate<SkillEntityData>>;
    effects: Map<string, ContentTemplate<EffectDefinitionData>>;
    jobs: Map<string, ContentTemplate<JobEntityData>>;
    spawnPools: Map<string, any>;
    config: GameConfig;
    ancestries: Map<string, AncestryData>;
}

// The raw input from YAML imports will be an object where each value is an array OR an object for config.
export interface RawGameContent {
    [key: string]: any[] | any;
}

export interface PlayerProgressionConfig {
    core_stats_per_level: number;
    gear_stat_budget: {
        base: number;
        per_level: number;
    };
}

export interface AncestryData {
    id: string;
    name: string;
    description: string;
    statModifiers: { [key: string]: number };
}

export class ContentService implements GameContent {
    public mobs!: Map<string, any>;
    public families!: Map<string, MobFamilyData>;
    public tiers!: Map<string, MobTierData>;
    public archetypes!: Map<string, MobArchetypeData>;
    public traits!: Map<string, TraitData>;
    public encounters!: Map<string, any>;
    public affixes!: Map<string, any>;
    public baseItems!: Map<string, any>;
    public locations!: Map<string, LocationEntityData>;
    public quests!: Map<string, ContentTemplate<QuestEntityData>>;
    public dialogueTrees!: Map<string, DialogueTree>;
    public nodes!: Map<string, ContentTemplate<NodeEntityData>>;
    public lootTables!: Map<string, any>;
    public skills!: Map<string, ContentTemplate<SkillEntityData>>;
    public effects!: Map<string, ContentTemplate<EffectDefinitionData>>;
    public jobs!: Map<string, ContentTemplate<JobEntityData>>;
    public spawnPools!: Map<string, any>;
    public config!: GameConfig;
    public ancestries!: Map<string, AncestryData>;

    constructor(rawContent: RawGameContent) {
        this.loadAllContent(rawContent);
        this.validateContent();
    }

    private loadAllContent(rawContent: RawGameContent): void {
        for (const [key, contentData] of Object.entries(rawContent)) {
            if (key === 'config') {
                this.config = contentData as GameConfig;
            } else if (Array.isArray(contentData)) {
                // Convert each array into a Map and assign it to the correct property.
                (this as any)[key] = new Map(contentData.map(item => [item.id, item]));
            }
        }
    }

    private validateContent(): void {
        if (!this.mobs || !this.mobs.get('PLAYER_TEMPLATE')) {
            console.error("[LOAD DIAGNOSTIC] CRITICAL: Player template NOT found after parsing.");
        }
    }
}


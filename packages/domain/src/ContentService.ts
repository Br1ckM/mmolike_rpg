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
}

// The raw input from YAML imports will be an object where each value is an array.
export interface RawGameContent {
    [key: string]: any[];
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

    constructor(rawContent: RawGameContent) {
        this.loadAllContent(rawContent);
        this.validateContent();
    }

    private loadAllContent(rawContent: RawGameContent): void {
        for (const [key, itemArray] of Object.entries(rawContent)) {
            if (Array.isArray(itemArray)) {
                // Convert each array into a Map and assign it to the correct property.
                (this as any)[key] = new Map(itemArray.map(item => [item.id, item]));
            }
        }
    }

    private validateContent(): void {
        if (!this.mobs || !this.mobs.get('PLAYER_TEMPLATE')) {
            console.error("[LOAD DIAGNOSTIC] CRITICAL: Player template NOT found after parsing.");
        }
    }
}
import type { MobFamilyData, MobTierData, MobArchetypeData } from './ecs/components/mob';
import type { TraitData } from './ecs/components/traits';

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
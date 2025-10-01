import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { MobFamilyData, MobTierData, MobArchetypeData } from './ecs/components/mob';
import { TraitData } from './ecs/components/traits';
// Import other data structure definitions as you create them

interface ContentItem {
    id: string;
}

export interface GameContent {
    mobs: Map<string, any>;
    families: Map<string, MobFamilyData>;
    tiers: Map<string, MobTierData>;
    archetypes: Map<string, MobArchetypeData>;
    traits: Map<string, TraitData>;
    encounters: Map<string, any>;
}

export class ContentService implements GameContent {
    // --- PROPERTIES ---
    // FIX: Added the definite assignment assertion (!) to each property.
    public mobs!: Map<string, any>;
    public families!: Map<string, MobFamilyData>;
    public tiers!: Map<string, MobTierData>;
    public archetypes!: Map<string, MobArchetypeData>;
    public traits!: Map<string, TraitData>;
    public encounters!: Map<string, any>;

    private contentFilePaths: Map<keyof GameContent, string>;

    // --- INITIALIZATION ---

    constructor(contentRootPath: string) {
        this.contentFilePaths = new Map();

        this.registerContent('mobs', `${contentRootPath}/mobs.yaml`);
        this.registerContent('families', `${contentRootPath}/families.yaml`);
        this.registerContent('tiers', `${contentRootPath}/tiers.yaml`);
        this.registerContent('archetypes', `${contentRootPath}/archetypes.yaml`);
        this.registerContent('traits', `${contentRootPath}/traits.yaml`);
        this.registerContent('encounters', `${contentRootPath}/encounters.yaml`);

        this.loadAllContent();
        this.validateContent();
    }

    // --- PUBLIC API ---

    public hotReload(contentKey?: keyof GameContent): void {
        if (contentKey) {
            const path = this.contentFilePaths.get(contentKey);
            if (path) {
                console.log(`Hot-reloading content for: ${contentKey}`);
                // FIX: Used 'as any' to resolve the complex type assignment error.
                this[contentKey] = this.loadDataFile(path) as any;
            }
        } else {
            console.log('Hot-reloading all game content...');
            this.loadAllContent();
        }
        this.validateContent();
    }

    // --- PRIVATE METHODS ---

    private registerContent(key: keyof GameContent, filePath: string): void {
        this.contentFilePaths.set(key, filePath);
    }

    private loadAllContent(): void {
        for (const [key, path] of this.contentFilePaths.entries()) {
            // FIX: Used 'as any' to resolve the complex type assignment error.
            this[key] = this.loadDataFile(path) as any;
        }
        console.log("All game content loaded.");
    }

    private loadDataFile<T extends ContentItem>(filePath: string): Map<string, T> {
        try {
            const fileContent = readFileSync(filePath, 'utf8');
            const dataArray: T[] = parse(fileContent);
            if (!Array.isArray(dataArray)) {
                throw new Error(`Content file is not a valid YAML array: ${filePath}`);
            }
            return new Map(dataArray.map(item => [item.id, item]));
        } catch (error) {
            console.error(`Failed to load content from ${filePath}:`, error);
            return new Map();
        }
    }

    private validateContent(): void {
        console.log("Validating content integrity...");
        for (const [mobId, mob] of this.mobs.entries()) {
            if (!this.families.has(mob.familyId)) {
                console.error(`Validation Error: Mob '${mobId}' has an invalid familyId: '${mob.familyId}'`);
            }
            // Add more checks here
        }
        console.log("Content validation complete.");
    }
}
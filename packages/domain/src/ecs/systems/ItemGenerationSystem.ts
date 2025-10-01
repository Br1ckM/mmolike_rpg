import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { Item, ItemData } from '../entities/item';
import { Character } from '../entities/character';
import {
    AffixData,
    ItemRarity,
    EquipableComponent,
    AffixesComponent,
    ItemInfoComponent
} from '../components/item';

// A simple utility function for rolling random numbers in a range.
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * A data structure to hold all the game content loaded from YAML files.
 * This would be loaded once when the application starts.
 */
interface GameContent {
    baseItems: Map<string, { components: ItemData }>;
    affixes: Map<string, AffixData & { id: string, name: string, type: 'prefix' | 'suffix' }>;
}

/**
 * Listens for `generateItemRequest` events and handles the logic
 * of creating a new item entity with random properties like rarity and affixes.
 */
export class ItemGenerationSystem {
    private world: ECS;
    private content: GameContent;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus, loadedContent: GameContent) {
        this.world = world;
        this.content = loadedContent;
        this.eventBus = eventBus;

        // This system's only trigger is this specific event.
        eventBus.on('generateItemRequest', this.onGenerateItemRequest.bind(this));
    }

    /**
     * The core handler for creating a new item.
     */
    private onGenerateItemRequest(payload: { baseItemId: string; characterId: number; }): void {
        const { baseItemId, characterId } = payload;
        const character = this.world.getEntity(characterId) as Character;
        const baseItemTemplate = this.content.baseItems.get(baseItemId);

        if (!character || !baseItemTemplate) {
            console.error(`Could not process item generation request for base item '${baseItemId}'`);
            return;
        }

        const { components: baseComponents } = baseItemTemplate;

        // --- Rarity and Affix Generation Logic ---
        const rarityRoll = Math.random();
        let rarity: ItemRarity = 'Common';
        const affixesToApply: AffixData[] = [];

        // Example rarity chances: 10% Rare, 30% Uncommon, 60% Common
        if (rarityRoll < 0.1) {
            rarity = 'Rare';
            const prefix = this.getRandomAffix('prefix');
            const suffix = this.getRandomAffix('suffix');
            if (prefix) affixesToApply.push(prefix);
            if (suffix) affixesToApply.push(suffix);
        } else if (rarityRoll < 0.4) {
            rarity = 'Uncommon';
            const affix = this.getRandomAffix(Math.random() < 0.5 ? 'prefix' : 'suffix');
            if (affix) affixesToApply.push(affix);
        }

        // --- Assemble the final ItemData for the new instance ---
        const newItemData: ItemData = {
            ...baseComponents,
            info: {
                ...baseComponents.info,
                name: this.generateItemName(baseComponents.info.name, affixesToApply),
                rarity: rarity,
            },
            affixes: affixesToApply,
        };

        // Create the new item entity and add it to the ECS world
        const itemEntity = new Item(newItemData);
        this.world.addEntity(itemEntity);

        console.log(`Generated item: ${newItemData.info.name}`);

        // Delegate the task of adding the item to the character's inventory
        this.giveItemToCharacter(character, itemEntity);
    }

    /**
     * Generates a descriptive name for an item based on its affixes.
     * e.g., "Sturdy Longsword of the Salamander"
     */
    private generateItemName(baseName: string, affixes: (AffixData & { name: string })[]): string {
        const prefix = affixes.find(a => a.type === 'prefix');
        const suffix = affixes.find(a => a.type === 'suffix');

        let name = baseName;
        if (prefix) name = `${prefix.name} ${name}`;
        if (suffix) name = `${name} ${suffix.name}`;

        return name;
    }

    /**
     * Selects a random affix of a given type from the loaded content.
     */
    private getRandomAffix(type: 'prefix' | 'suffix'): (AffixData & { name: string }) | null {
        const allOfType = [...this.content.affixes.values()].filter(a => a.type === type);
        if (allOfType.length === 0) return null;
        return allOfType[Math.floor(Math.random() * allOfType.length)];
    }

    /**
     * Placeholder function to give the generated item to a character.
     * In a real implementation, this would emit another event or call an InventorySystem.
     */
    private giveItemToCharacter(character: Character, item: Entity): void {
        // Instead of logging, we now emit a formal event for the InventorySystem to handle.
        this.eventBus.emit('addItemToInventory', {
            characterId: character.id,
            itemEntityId: item.id,
        });
    }
}
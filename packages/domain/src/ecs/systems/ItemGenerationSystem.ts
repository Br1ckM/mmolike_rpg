import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { Item, type ItemData } from '../entities/item';
import { Character } from '../entities/character';
import {
    type AffixData,
    type ItemRarity,
    EquipableComponent,
    AffixesComponent,
    ItemInfoComponent
} from '../components/item';
import { type GameContent, type GameConfig } from '../../ContentService'; // <-- UPDATED IMPORT

// A simple utility function for rolling random numbers in a range.
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// The local GameContent interface has been removed to avoid type conflicts.

/**
 * Listens for `generateItemRequest` events and handles the logic
 * of creating a new item entity with random properties like rarity and affixes.
 */
export class ItemGenerationSystem {
    private world: ECS;
    private content: GameContent;
    private eventBus: EventBus;
    private config: GameConfig;

    constructor(world: ECS, eventBus: EventBus, loadedContent: GameContent) {
        this.world = world;
        this.content = loadedContent;
        this.eventBus = eventBus;
        this.config = loadedContent.config;

        eventBus.on('generateItemRequest', this.onGenerateItemRequest.bind(this));
    }

    private rollForRarity(): ItemRarity {
        const roll = Math.random();
        let cumulativeChance = 0;
        const rarities = Object.entries(this.config.rarity_chances).sort(([, a], [, b]) => a - b);

        for (const [rarity, chance] of rarities) {
            cumulativeChance += chance;
            if (roll < cumulativeChance) {
                return rarity as ItemRarity;
            }
        }
        return 'Common'; // Fallback
    }

    private onGenerateItemRequest(payload: { baseItemId: string; characterId: number; itemLevel: number }): void {
        const { baseItemId, characterId, itemLevel } = payload;
        const character = this.world.getEntity(characterId) as Character;
        const baseItemTemplate = this.content.baseItems.get(baseItemId);

        if (!character || !baseItemTemplate) {
            console.error(`Could not process item generation request for base item '${baseItemId}'`);
            return;
        }

        const baseComponents: ItemData = JSON.parse(JSON.stringify(baseItemTemplate.components));

        if (baseComponents.info.itemType !== 'equipment' || !baseComponents.equipable) {
            if (baseComponents.stackable) {
                baseComponents.stackable.current = 1;
            }
            const nonEquipItem = new Item(baseComponents);
            this.world.addEntity(nonEquipItem);
            this.giveItemToCharacter(character, nonEquipItem);
            return;
        }

        // 1. Roll for Rarity
        const rarity = this.rollForRarity();
        const affixRules = this.config.rarity_affixes[rarity.toLowerCase()];
        const affixesToApply: (AffixData & { effects: { stat: string, value: number }[] })[] = [];

        // 2. Select Affixes based on Rarity Rules
        if (affixRules) {
            const prefixes = [...this.content.affixes.values()].filter(a => a.type === 'prefix');
            const suffixes = [...this.content.affixes.values()].filter(a => a.type === 'suffix');

            const numPrefixes = Array.isArray(affixRules.prefixes) ? randomNumber(affixRules.prefixes[0], affixRules.prefixes[1]) : affixRules.prefixes;
            const numSuffixes = Array.isArray(affixRules.suffixes) ? randomNumber(affixRules.suffixes[0], affixRules.suffixes[1]) : affixRules.suffixes;

            for (let i = 0; i < numPrefixes && prefixes.length > 0; i++) {
                const randIndex = Math.floor(Math.random() * prefixes.length);
                affixesToApply.push(prefixes.splice(randIndex, 1)[0]);
            }
            for (let i = 0; i < numSuffixes && suffixes.length > 0; i++) {
                const randIndex = Math.floor(Math.random() * suffixes.length);
                affixesToApply.push(suffixes.splice(randIndex, 1)[0]);
            }
        }

        const newItemData: ItemData = { ...baseComponents, info: { ...baseComponents.info, rarity }, affixes: affixesToApply };

        // 3. Calculate Power Budget
        const { base, per_level } = this.content.config.player_progression.gear_stat_budget;
        const targetBudget = base + (per_level * (itemLevel - 1));

        let currentStatValue = 0;
        if (newItemData.equipable) {
            currentStatValue = Object.values(newItemData.equipable.baseStats).reduce((sum, val) => sum + val, 0);
            for (const affix of affixesToApply) {
                for (const effect of affix.effects) {
                    currentStatValue += Math.abs(effect.value);
                }
            }
        }

        // 4. Scale Stats to Budget
        const scalingFactor = targetBudget / Math.max(1, currentStatValue);
        if (newItemData.equipable) {
            for (const stat in newItemData.equipable.baseStats) {
                newItemData.equipable.baseStats[stat] = Math.round(newItemData.equipable.baseStats[stat] * scalingFactor);
            }
            for (const affix of affixesToApply) {
                for (const effect of affix.effects) {
                    newItemData.equipable.baseStats[effect.stat] = (newItemData.equipable.baseStats[effect.stat] || 0) + Math.round(effect.value * scalingFactor);
                }
            }
        }

        newItemData.info.name = this.generateItemName(baseComponents.info.name, affixesToApply as any);

        const itemEntity = new Item(newItemData);
        this.world.addEntity(itemEntity);

        console.log(`Generated Lvl ${itemLevel} [${rarity}] item: ${newItemData.info.name}`);
        this.giveItemToCharacter(character, itemEntity);
    }

    private generateItemName(baseName: string, affixes: (AffixData & { name: string, type: 'prefix' | 'suffix' })[]): string {
        const prefix = affixes.find(a => a.type === 'prefix');
        const suffix = affixes.find(a => a.type === 'suffix');

        let name = baseName;
        if (prefix) name = `${prefix.name} ${name}`;
        if (suffix) name = `${name} ${suffix.name}`;

        return name;
    }

    private giveItemToCharacter(character: Character, item: Entity): void {
        this.eventBus.emit('addItemToInventory', {
            characterId: character.id,
            itemEntityId: item.id,
        });
    }
}

import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { QuestRewardComponent, QuestComponent } from '../components/quest';
import { InventoryComponent } from '../components/character';
import { CurrencyComponent } from '../components/item';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Handles the distribution of quest rewards when a quest is turned in.
 */
export class QuestRewardSystem extends GameSystem { // Extend GameSystem
    // --- FIX: This system needs the content map to find quest entities ---
    private contentIdToEntityIdMap: Map<string, number>;

    constructor(world: ECS, eventBus: EventBus, contentIdToEntityIdMap: Map<string, number>) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;

        // Use the inherited 'subscribe' method
        this.subscribe('questTurnedIn', this.onQuestTurnedIn.bind(this));
    }

    private onQuestTurnedIn(payload: { characterId: number; questId: string; }): void {
        const character = this.world.getEntity(payload.characterId);

        // --- FIX: Use the map to find the quest entity by its string ID ---
        const questEntityId = this.contentIdToEntityIdMap.get(payload.questId);
        const questEntity = questEntityId ? this.world.getEntity(questEntityId) : undefined;
        // --- END FIX ---

        if (!character || !questEntity) return;

        const rewards = QuestRewardComponent.oneFrom(questEntity)?.data;
        const questInfo = QuestComponent.oneFrom(questEntity)?.data;

        if (!rewards) {
            console.log(`Quest '${payload.questId}' has no rewards.`);
            return;
        }

        this.eventBus.emit('experienceGained', {
            characterId: character.id,
            amount: rewards.experience,
        });

        // Grant Gold
        if (rewards.gold) {
            const inventory = InventoryComponent.oneFrom(character)?.data;
            if (inventory?.walletId) {
                const wallet = this.world.getEntity(parseInt(inventory.walletId, 10));
                if (wallet) {
                    const currency = CurrencyComponent.oneFrom(wallet)?.data;
                    if (currency) {
                        currency.gold += rewards.gold;
                        console.log(`Character ${character.id} gained ${rewards.gold} gold.`);
                    }
                }
            }
        }

        // Grant Items
        if (rewards.itemIds) {
            const itemLevel = questInfo?.suggestedLevel ?? 1;
            for (const itemId of rewards.itemIds) {
                this.eventBus.emit('generateItemRequest', {
                    baseItemId: itemId,
                    characterId: character.id,
                    itemLevel: itemLevel,
                });
                console.log(`Awarding item '${itemId}' to character ${character.id}.`);
            }
        }
    }
}
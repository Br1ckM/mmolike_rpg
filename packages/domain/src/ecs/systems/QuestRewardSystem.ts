import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { QuestRewardComponent, QuestComponent } from '../components/quest';
import { InventoryComponent } from '../components/character';
import { CurrencyComponent } from '../components/item';

/**
 * Handles the distribution of quest rewards when a quest is turned in.
 */
export class QuestRewardSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('questTurnedIn', this.onQuestTurnedIn.bind(this));
    }

    private onQuestTurnedIn(payload: { characterId: number; questId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        const questEntity = this.world.getEntity(parseInt(payload.questId, 10));

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

            // Grant Items
            if (rewards.itemIds) {
                const itemLevel = questInfo?.suggestedLevel ?? 1; // Get the quest level
                for (const itemId of rewards.itemIds) {
                    // Emit an event for the ItemGenerationSystem to create the item
                    // and give it to the character, now including the itemLevel.
                    this.eventBus.emit('generateItemRequest', {
                        baseItemId: itemId,
                        characterId: character.id,
                        itemLevel: itemLevel, // Pass the quest's level
                    });
                    console.log(`Awarding item '${itemId}' to character ${character.id}.`);
                }
            }
        }
    }
}
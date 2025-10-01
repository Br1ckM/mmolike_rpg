import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { Character } from '../entities/character';

const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Listens for various game events and resolves their loot tables.
 * If a loot drop is successful, it emits a `generateItemRequest` event.
 */
export class LootResolutionSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: { lootTables: Map<string, any> };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;

        eventBus.on('enemyDefeated', this.onEnemyDefeated.bind(this));
        // You would add other listeners here, e.g., eventBus.on('lootContainerOpened', ...)
    }

    private onEnemyDefeated(payload: { enemyId: string; characterId: number; }): void {
        const lootTableData = this.content.lootTables.get(payload.enemyId);
        if (!lootTableData) return;

        for (const entry of lootTableData.entries) {
            if (Math.random() <= entry.chance) {
                if (entry.type === 'generated_item') {
                    // Fire the specific event for the ItemGenerationSystem to handle
                    this.eventBus.emit('generateItemRequest', {
                        baseItemId: entry.id,
                        characterId: payload.characterId,
                    });
                }
                // ... handle currency or static item drops here
            }
        }
    }
}
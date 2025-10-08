import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { Character } from '../entities/character';
import { ProgressionComponent } from '../components/skill';

const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Listens for various game events and resolves their loot tables.
 * If a loot drop is successful, it emits a `generateItemRequest` event.
 */
export class LootResolutionSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: { lootTables: Map<string, any>; baseItems: Map<string, any> };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;

        eventBus.on('enemyDefeated', this.onEnemyDefeated.bind(this));
        eventBus.on('gatherResourceRequested', this.onGatherResource.bind(this));
    }

    private onEnemyDefeated(payload: { enemyId: string; characterId: number; level: number }): void {
        const lootTableData = this.content.lootTables.get(payload.enemyId);
        if (!lootTableData) return;

        for (const entry of lootTableData.entries) {
            if (Math.random() <= entry.chance) {
                if (entry.type === 'generated_item') {
                    // Fire the specific event for the ItemGenerationSystem to handle
                    this.eventBus.emit('generateItemRequest', {
                        baseItemId: entry.id,
                        characterId: payload.characterId,
                        itemLevel: payload.level, // Pass the mob's level
                    });
                }
                // ... handle currency or static item drops here
            }
        }
    }

    private onGatherResource(payload: { characterId: number; lootTableId: string }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        const playerLevel = ProgressionComponent.oneFrom(character)?.data.level || 1;
        const lootTableData = this.content.lootTables.get(payload.lootTableId);
        if (!lootTableData) {
            console.error(`Loot table "${payload.lootTableId}" not found.`);
            return;
        }

        let itemsGenerated = false;
        for (const entry of lootTableData.entries) {
            if (Math.random() <= entry.chance) {
                const quantity = randomNumber(entry.quantity[0], entry.quantity[1]);

                if (quantity > 0) {
                    for (let i = 0; i < quantity; i++) {
                        this.eventBus.emit('generateItemRequest', {
                            baseItemId: entry.id,
                            characterId: payload.characterId,
                            itemLevel: playerLevel, // Item level matches player level for gathering
                        });
                    }

                    const itemTemplate = this.content.baseItems.get(entry.id);
                    if (itemTemplate) {
                        this.eventBus.emit('notification', {
                            type: 'success',
                            message: `Gathered ${quantity}x ${itemTemplate.components.info.name}`
                        });
                    }
                    itemsGenerated = true;
                }
            }
        }

        if (!itemsGenerated) {
            this.eventBus.emit('notification', {
                type: 'info',
                message: `You found nothing of value.`
            });
        }
    }
}

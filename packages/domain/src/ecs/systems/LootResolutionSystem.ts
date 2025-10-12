import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { ProgressionComponent } from '../components/skill';
import { GameSystem } from './GameSystem';
// --- START: Import necessary components ---
import { MobComponent, LootTableComponent } from '../components/mob';
// --- END: Import necessary components ---

const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Listens for various game events and resolves their loot tables.
 * If a loot drop is successful, it emits a `generateItemRequest` event.
 */
export class LootResolutionSystem extends GameSystem {
    private content: { lootTables: Map<string, any>; baseItems: Map<string, any> };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.content = loadedContent;

        // Use the inherited 'subscribe' method
        this.subscribe('enemyDefeated', this.onEnemyDefeated.bind(this));
        this.subscribe('gatherResourceRequested', this.onGatherResource.bind(this));
    }

    private onEnemyDefeated(payload: { protoId: string, characterId: number; level: number; lootTableIds: string[] }): void {
        console.log(`[LootResolutionSystem] onEnemyDefeated received for: ${payload.protoId}`);

        // --- REVISED LOGIC ---
        // Directly use the loot table IDs from the event payload.
        // No need to fetch the entity from the world anymore.
        if (!payload.lootTableIds || payload.lootTableIds.length === 0) {
            return; // No loot tables for this mob.
        }

        for (const tableId of payload.lootTableIds) {
            const lootTableData = this.content.lootTables.get(tableId);
            if (!lootTableData) {
                console.warn(`[LootResolutionSystem] Could not find loot table with ID: ${tableId}`);
                continue;
            }

            for (const entry of lootTableData.entries) {
                if (Math.random() <= entry.chance) {
                    if (entry.type === 'generated_item') {
                        this.eventBus.emit('generateItemRequest', {
                            baseItemId: entry.id,
                            characterId: payload.characterId,
                            itemLevel: payload.level,
                        });
                    }
                }
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
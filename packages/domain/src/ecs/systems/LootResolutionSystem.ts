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

    private onEnemyDefeated(payload: { enemyId: string; characterId: number; level: number }): void {
        console.log(`[LootResolutionSystem] onEnemyDefeated received: ${payload.enemyId} (char ${payload.characterId}) level ${payload.level}`);

        const enemyEntity = this.world.getEntity(parseInt(payload.enemyId, 10));
        if (!enemyEntity) {
            console.error(`[LootResolutionSystem] Could not find defeated enemy entity with ID: ${payload.enemyId}`);
            return;
        }

        const lootComponent = LootTableComponent.oneFrom(enemyEntity)?.data;
        if (!lootComponent || !lootComponent.tableIds || lootComponent.tableIds.length === 0) {
            // No loot tables for this mob, which is valid.
            return;
        }

        // --- START: Refactored Loot Logic ---
        // Process every loot table attached to the mob (from its family, tier, etc.)
        for (const tableId of lootComponent.tableIds) {
            const lootTableData = this.content.lootTables.get(tableId);
            if (!lootTableData) {
                console.warn(`[LootResolutionSystem] Could not find loot table with ID: ${tableId}`);
                continue;
            }

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
        // --- END: Refactored Loot Logic ---
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
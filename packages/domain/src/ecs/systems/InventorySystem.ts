import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { InventoryComponent } from '../components/character';
import { Item } from '../entities/item';
import {
    SlotsComponent,
    StackableComponent,
    ItemInfoComponent
} from '../components/item';

/**
 * Manages all inventory-related logic, such as adding, removing, and stacking items.
 * This is a service system that reacts to events rather than running in the main update loop.
 */
export class InventorySystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('addItemToInventory', this.handleAddItem.bind(this));
        this.eventBus.on('removeItemFromInventory', this.handleRemoveItem.bind(this));
    }

    /**
     * Event handler for when an item needs to be added to a character's inventory.
     */
    private handleAddItem(payload: { characterId: number; itemEntityId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        const item = this.world.getEntity(payload.itemEntityId);

        if (!character || !item) return;

        const success = this.addItem(character, item);

        if (success) {
            // After successfully adding, notify the system that the player's state has changed.
            this.eventBus.emit('playerStateModified', { characterId: character.id });
        } else {
            this.eventBus.emit('inventoryFull', {
                characterId: character.id,
                itemEntityId: item.id
            });
            console.log(`Inventory full for character ${character.id}. Could not add item ${item.id}.`);
        }
    }

    /**
     * The core logic for adding an item to the first available slot or stack in a character's bags.
     * @returns `true` if the item was successfully added, otherwise `false`.
     */
    private addItem(character: Entity, item: Entity): boolean {
        const inventory = InventoryComponent.oneFrom(character);
        if (!inventory) return false;

        const itemInfo = ItemInfoComponent.oneFrom(item);
        const itemStack = StackableComponent.oneFrom(item);
        let itemAdded = false;

        // --- Step 1: Try to stack the item ---
        if (itemStack) {
            for (const bagId of inventory.data.bagIds) {
                const bagEntity = this.world.getEntity(parseInt(bagId, 10));
                if (!bagEntity) continue;

                const slots = SlotsComponent.oneFrom(bagEntity)?.data;
                if (!slots) continue;

                for (let i = 0; i < slots.items.length; i++) {
                    const existingItemIdStr = slots.items[i];
                    if (!existingItemIdStr) continue;

                    const existingItem = this.world.getEntity(parseInt(existingItemIdStr, 10));
                    if (!existingItem) continue;

                    const existingItemStack = StackableComponent.oneFrom(existingItem);
                    const existingItemInfo = ItemInfoComponent.oneFrom(existingItem);

                    // Check if items are the same and if the existing stack is not full
                    if (
                        existingItemStack &&
                        existingItemInfo?.data.name === itemInfo?.data.name &&
                        existingItemStack.data.current < existingItemStack.data.maxStack
                    ) {
                        // Increment the stack and destroy the new item entity
                        existingItemStack.data.current += 1;
                        this.world.removeEntity(item);
                        itemAdded = true;
                        console.log(`Stacked ${itemInfo?.data.name}. New count: ${existingItemStack.data.current}`);
                        break;
                    }
                }
                if (itemAdded) break;
            }
        }

        // --- Step 2: If not stacked, find an empty slot ---
        if (!itemAdded) {
            for (const bagId of inventory.data.bagIds) {
                const bagEntity = this.world.getEntity(parseInt(bagId, 10));
                if (!bagEntity) continue;

                const slots = SlotsComponent.oneFrom(bagEntity)?.data;
                if (!slots) continue;

                const emptySlotIndex = slots.items.indexOf(null);

                if (emptySlotIndex !== -1) {
                    slots.items[emptySlotIndex] = item.id.toString();
                    itemAdded = true;
                    console.log(`Added ${itemInfo?.data.name} to an empty slot in bag ${bagId}.`);
                    break;
                }
            }
        }

        return itemAdded;
    }

    private handleRemoveItem(payload: { characterId: number; itemEntityId: number; reason: 'consume' | 'drop' | 'equip'; }): void {
        const character = this.world.getEntity(payload.characterId);
        const itemToRemove = this.world.getEntity(payload.itemEntityId);

        if (!character || !itemToRemove) return;

        const wasRemoved = this.findAndRemoveItemFromBags(character, itemToRemove.id);

        if (wasRemoved) {
            if (payload.reason === 'equip') {
                this.eventBus.emit('itemRemovedForEquip', {
                    characterId: payload.characterId,
                    itemEntityId: payload.itemEntityId,
                });
            } else {
                this.world.removeEntity(itemToRemove);
                console.log(`Removed and destroyed item ${itemToRemove.id}.`);
            }
        } else {
            console.warn(`Could not find item ${itemToRemove.id} to remove.`);
        }
    }

    private findAndRemoveItemFromBags(character: Entity, itemToRemoveId: number): boolean {
        const inventory = InventoryComponent.oneFrom(character)?.data;
        if (!inventory) return false;

        for (const bagIdStr of inventory.bagIds) {
            const bag = this.world.getEntity(parseInt(bagIdStr, 10));
            if (!bag) continue;

            const slots = SlotsComponent.oneFrom(bag)?.data;
            if (!slots) continue;

            const itemIndex = slots.items.findIndex(id => id ? parseInt(id, 10) === itemToRemoveId : false);
            if (itemIndex !== -1) {
                slots.items[itemIndex] = null;
                return true;
            }
        }
        return false;
    }
}


import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { InventoryComponent } from '../components/character';
import {
    SlotsComponent,
    StackableComponent,
    ItemInfoComponent
} from '../components/item';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Manages all inventory-related logic, such as adding, removing, and stacking items.
 * This is a service system that reacts to events rather than running in the main update loop.
 */
export class InventorySystem extends GameSystem { // Extend GameSystem

    constructor(world: ECS, eventBus: EventBus) {
        // This system is event-driven.
        super(world, eventBus, []);

        // Use the inherited 'subscribe' method
        this.subscribe('addItemToInventory', this.handleAddItem.bind(this));
        this.subscribe('removeItemFromInventory', this.handleRemoveItem.bind(this));
        this.subscribe('inventoryItemMovedRequest', this.handleItemMove.bind(this));
    }

    /**
     * Event handler for when an item needs to be added to a character's inventory.
     */
    private handleAddItem(payload: { characterId: number; itemEntityId: number; baseItemId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        const item = this.world.getEntity(payload.itemEntityId);

        if (!character || !item) return;

        const success = this.addItem(character, item);

        if (success) {
            this.eventBus.emit('itemPickedUp', {
                characterId: character.id,
                itemBaseId: payload.baseItemId
            });
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

                    if (
                        existingItemStack &&
                        existingItemInfo?.data.name === itemInfo?.data.name &&
                        existingItemStack.data.current < existingItemStack.data.maxStack
                    ) {
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

    private handleRemoveItem(payload: { characterId: number; itemEntityId: number; quantity: number; reason: 'consume' | 'drop' | 'equip'; }): void {
        const character = this.world.getEntity(payload.characterId);
        const itemToRemove = this.world.getEntity(payload.itemEntityId);
        if (!character || !itemToRemove) return;

        const stack = StackableComponent.oneFrom(itemToRemove);

        if (stack && stack.data.current > payload.quantity) {
            stack.data.current -= payload.quantity;
            console.log(`Removed ${payload.quantity} from stack. New count: ${stack.data.current}`);
        } else {
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

    private handleItemMove(payload: {
        characterId: number;
        source: { bagId: number; slotIndex: number };
        target: { bagId: number; slotIndex: number };
    }): void {
        const { characterId, source, target } = payload;
        const sourceBagEntity = this.world.getEntity(source.bagId);
        const targetBagEntity = this.world.getEntity(target.bagId);

        if (!sourceBagEntity || !targetBagEntity) {
            console.error('[InventorySystem] Could not find source or target bag for move operation.');
            return;
        }

        const sourceSlots = SlotsComponent.oneFrom(sourceBagEntity)?.data;
        const targetSlots = SlotsComponent.oneFrom(targetBagEntity)?.data;

        if (!sourceSlots || !targetSlots) {
            console.error('[InventorySystem] Could not find slots component on source or target bag.');
            return;
        }

        const sourceItem = sourceSlots.items[source.slotIndex];
        const targetItem = targetSlots.items[target.slotIndex];

        sourceSlots.items[source.slotIndex] = targetItem;
        targetSlots.items[target.slotIndex] = sourceItem;

        console.log(`[InventorySystem] Swapped item from Bag ${source.bagId}[${source.slotIndex}] to Bag ${target.bagId}[${target.slotIndex}].`);

        this.eventBus.emit('playerStateModified', { characterId });
    }
}
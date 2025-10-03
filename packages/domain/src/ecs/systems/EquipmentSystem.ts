import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib'
import { EventBus } from '../EventBus';
import {
    EquipmentComponent,
    type EquipmentSlot
} from '../components/character';
import { EquipableComponent } from '../components/item';

/**
 * Manages equipping and unequipping items by reacting to events.
 * It is fully decoupled from the InventorySystem.
 */
export class EquipmentSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        // Listen for requests from the UI/Player
        eventBus.on('equipItemRequest', this.handleEquipRequest.bind(this));
        eventBus.on('unequipItemRequest', this.handleUnequipRequest.bind(this));

        // Listen for the confirmation event from the InventorySystem
        eventBus.on('itemRemovedForEquip', this.handleItemRemovedForEquip.bind(this));
    }

    /**
     * Step 1: An equip is requested. Ask the InventorySystem to remove the item.
     */
    private handleEquipRequest(payload: { characterId: number; itemEntityId: number; }): void {
        // Fire an event to have the item removed from inventory, providing 'equip' as the reason.
        this.eventBus.emit('removeItemFromInventory', {
            ...payload,
            reason: 'equip'
        });
    }

    /**
     * Step 2: The InventorySystem confirms the item has been removed. Now we can proceed.
     */
    private handleItemRemovedForEquip(payload: { characterId: number; itemEntityId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        const itemToEquip = this.world.getEntity(payload.itemEntityId);

        if (!character || !itemToEquip) return;

        const equipment = EquipmentComponent.oneFrom(character)?.data;
        const equipable = EquipableComponent.oneFrom(itemToEquip)?.data;

        if (!equipment || !equipable) return;

        // If a different item is in the slot, unequip it first.
        const currentItemInSlotId = equipment[equipable.slot];
        if (currentItemInSlotId) {
            this.unequipItem(character, equipable.slot);
        }

        // Equip the new item.
        equipment[equipable.slot] = itemToEquip.id.toString();
        console.log(`Equipped item ${itemToEquip.id} to ${equipable.slot} for character ${character.id}.`);

        this.eventBus.emit('characterEquipmentChanged', { characterId: character.id });
    }

    private handleUnequipRequest(payload: { characterId: number; slot: EquipmentSlot; }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        this.unequipItem(character, payload.slot);
    }

    private unequipItem(character: Entity, slot: EquipmentSlot): void {
        const equipment = EquipmentComponent.oneFrom(character)?.data;
        if (!equipment) return;

        const equippedItemIdStr = equipment[slot];
        if (!equippedItemIdStr) return;

        equipment[slot] = null;

        this.eventBus.emit('addItemToInventory', {
            characterId: character.id,
            itemEntityId: parseInt(equippedItemIdStr, 10)
        });

        this.eventBus.emit('characterEquipmentChanged', { characterId: character.id });
    }
}
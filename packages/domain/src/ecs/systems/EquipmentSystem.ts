import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import {
    EquipmentComponent,
    type EquipmentSlot
} from '../components/character';
import { EquipableComponent } from '../components/item';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Manages equipping and unequipping items by reacting to events.
 * It is fully decoupled from the InventorySystem.
 */
export class EquipmentSystem extends GameSystem { // Extend GameSystem

    constructor(world: ECS, eventBus: EventBus) {
        // This system is event-driven.
        super(world, eventBus, []);

        // Use the inherited 'subscribe' method
        this.subscribe('equipItemRequest', this.handleEquipRequest.bind(this));
        this.subscribe('unequipItemRequest', this.handleUnequipRequest.bind(this));
        this.subscribe('itemRemovedForEquip', this.handleItemRemovedForEquip.bind(this));
    }

    /**
     * Step 1: An equip is requested. Ask the InventorySystem to remove the item.
     */
    private handleEquipRequest(payload: { characterId: number; itemEntityId: number; }): void {
        this.eventBus.emit('removeItemFromInventory', {
            ...payload,
            quantity: 1,
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

        const currentItemInSlotId = equipment[equipable.slot];
        if (currentItemInSlotId) {
            this.unequipItem(character, equipable.slot);
        }

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
            itemEntityId: parseInt(equippedItemIdStr, 10),
            baseItemId: '' // Note: InventorySystem needs a baseItemId
        });

        this.eventBus.emit('characterEquipmentChanged', { characterId: character.id });
    }
}
import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { HealthComponent, ConsumableBeltComponent } from '../components/character';
import { ConsumableComponent } from '../components/item';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Manages the effects of using consumable items.
 */
export class ConsumableSystem extends GameSystem { // Extend GameSystem

    constructor(world: ECS, eventBus: EventBus) {
        // This system is event-driven and doesn't need to iterate over components in a loop.
        super(world, eventBus, []);

        // Use the inherited 'subscribe' method
        this.subscribe('useConsumableRequest', this.handleUseConsumable.bind(this));
        this.subscribe('useItemInBeltRequest', this.handleUseItemInBelt.bind(this));
    }

    private handleUseItemInBelt(payload: { characterId: number; beltIndex: number; combatEntityId?: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        const belt = ConsumableBeltComponent.oneFrom(character)?.data;
        const itemId = belt?.itemIds[payload.beltIndex];

        if (itemId) {
            const itemEntityId = parseInt(itemId, 10);
            const wasConsumed = this.applyConsumableEffect(character, itemEntityId);

            if (wasConsumed) {
                // Remove the item from the belt
                if (belt) { // Null check for safety
                    belt.itemIds[payload.beltIndex] = null;
                }

                // Also remove it from inventory entirely
                this.eventBus.emit('removeItemFromInventory', {
                    characterId: payload.characterId,
                    itemEntityId,
                    quantity: 1,
                    reason: 'consume'
                });

                // If in combat, signal that an action was taken
                if (payload.combatEntityId) {
                    this.eventBus.emit('actionTaken', {
                        combatEntityId: payload.combatEntityId,
                        actorId: String(payload.characterId),
                        actionType: 'ITEM',
                    });
                }
            }
        }
    }

    private handleUseConsumable(payload: { characterId: number; itemEntityId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        const wasConsumed = this.applyConsumableEffect(character, payload.itemEntityId);

        if (wasConsumed) {
            // After applying the effect, request to remove the item from inventory
            this.eventBus.emit('removeItemFromInventory', {
                characterId: character.id,
                itemEntityId: payload.itemEntityId,
                quantity: 1,
                reason: 'consume'
            });
        }
    }

    private applyConsumableEffect(character: Entity, itemEntityId: number): boolean {
        const item = this.world.getEntity(itemEntityId);
        if (!item) return false;

        const consumable = ConsumableComponent.oneFrom(item)?.data;
        if (!consumable) return false;

        switch (consumable.effect) {
            case 'RESTORE_HEALTH':
                this.restoreHealth(character, consumable.amount);
                break;
            default:
                console.warn(`Unknown consumable effect: ${consumable.effect}`);
                return false;
        }
        return true;
    }

    private restoreHealth(character: Entity, amount: number): void {
        const health = HealthComponent.oneFrom(character)?.data;
        if (!health) return;

        const previousHealth = health.current;
        health.current = Math.min(health.max, health.current + amount);
        const amountHealed = health.current - previousHealth;

        console.log(`Character ${character.id} healed for ${amountHealed} HP.`);
    }
}
import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { HealthComponent, ConsumableBeltComponent } from '../components/character';
import { ConsumableComponent } from '../components/item'

/**
 * Manages the effects of using consumable items.
 */
export class ConsumableSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        eventBus.on('useConsumableRequest', this.handleUseConsumable.bind(this));
        eventBus.on('useItemInBeltRequest', this.handleUseItemInBelt.bind(this));
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
                belt.itemIds[payload.beltIndex] = null;

                // Also remove it from inventory entirely if it's not stackable or the stack is depleted
                this.eventBus.emit('removeItemFromInventory', {
                    characterId: payload.characterId,
                    itemEntityId,
                    reason: 'consume'
                });

                // If in combat, signal to the combat system that an action was taken
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
                reason: 'consume'
            });
        }
    }

    private applyConsumableEffect(character: Entity, itemEntityId: number): boolean {
        const item = this.world.getEntity(itemEntityId);
        if (!item) return false;

        const consumable = ConsumableComponent.oneFrom(item)?.data;
        if (!consumable) return false; // Item is not a consumable

        // Apply the effect based on its type
        switch (consumable.effect) {
            case 'RESTORE_HEALTH':
                this.restoreHealth(character, consumable.amount);
                break;
            // You could add more cases here, like 'RESTORE_MANA', 'GRANT_BUFF', etc.
            default:
                console.warn(`Unknown consumable effect: ${consumable.effect}`);
                return false; // Don't consume the item if the effect is unknown
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
import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { HealthComponent } from '../components/character';
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
    }

    private handleUseConsumable(payload: { characterId: number; itemEntityId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        const item = this.world.getEntity(payload.itemEntityId);

        if (!character || !item) return;

        const consumable = ConsumableComponent.oneFrom(item)?.data;
        if (!consumable) return; // Item is not a consumable

        // Apply the effect based on its type
        switch (consumable.effect) {
            case 'RESTORE_HEALTH':
                this.restoreHealth(character, consumable.amount);
                break;
            // You could add more cases here, like 'RESTORE_MANA', 'GRANT_BUFF', etc.
            default:
                console.warn(`Unknown consumable effect: ${consumable.effect}`);
                return; // Don't consume the item if the effect is unknown
        }

        // After applying the effect, request to remove the item from inventory
        this.eventBus.emit('removeItemFromInventory', {
            characterId: character.id,
            itemEntityId: item.id,
            reason: 'consume'
        });
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
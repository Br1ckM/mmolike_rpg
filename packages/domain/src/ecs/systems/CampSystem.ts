import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { HealthComponent, ManaComponent, ControllableComponent } from '../components/character';
import { CompanionComponent } from '../components/npc';

/**
 * Handles non-combat, camp-related activities like resting.
 */
export class CampSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('restRequested', this.handleRest.bind(this));
    }

    /**
     * Restores the health and mana of the entire active party.
     */
    private handleRest(payload: { characterId: number }): void {
        const playerEntity = this.world.getEntity(payload.characterId);
        if (!playerEntity || !ControllableComponent.oneFrom(playerEntity)) {
            console.warn(`[CampSystem] Rest requested for a non-player entity.`);
            return;
        }

        const partyToRest: Entity[] = [playerEntity];

        // Find all active companions to include them in the rest action
        const allEntities = (this.world as any).entities as Entity[];
        allEntities.forEach(entity => {
            const companion = CompanionComponent.oneFrom(entity)?.data;
            if (companion && companion.recruited && companion.inActiveParty) {
                partyToRest.push(entity);
            }
        });

        // Restore health and mana for each party member
        partyToRest.forEach(character => {
            const health = HealthComponent.oneFrom(character)?.data;
            const mana = ManaComponent.oneFrom(character)?.data;

            if (health) {
                health.current = health.max;
            }
            if (mana) {
                mana.current = mana.max;
            }
        });

        console.log('[CampSystem] Active party has rested. Health and mana restored.');

        // --- FIX: Emit events to notify the UI of the changes ---
        this.eventBus.emit('notification', {
            type: 'success',
            message: 'Your party feels well-rested.'
        });

        this.eventBus.emit('playerStateModified', { characterId: playerEntity.id });
    }
}
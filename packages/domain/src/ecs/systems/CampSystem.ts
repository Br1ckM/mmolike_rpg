import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { HealthComponent, ManaComponent, ControllableComponent } from '../components/character';
import { CompanionComponent } from '../components/npc'; // Correct component import

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
     * Restores the health and mana of the entire party.
     */
    private handleRest(payload: { characterId: number }): void {
        const playerEntity = this.world.getEntity(payload.characterId);
        if (!playerEntity || !ControllableComponent.oneFrom(playerEntity)) {
            console.warn(`[CampSystem] Rest requested for a non-player entity.`);
            return;
        }

        const charactersToRest: Entity[] = [];

        // --- FIX: Use the same pattern as PartySystem to find all party members ---
        // This is acknowledged as a workaround for the private 'entities' property.
        const allEntities = (this.world as any).entities as Entity[];

        allEntities.forEach(entity => {
            const isPlayer = ControllableComponent.oneFrom(entity);
            const companion = CompanionComponent.oneFrom(entity)?.data;

            // Add the player and any recruited companions to the list
            if (isPlayer || (companion && companion.recruited)) {
                charactersToRest.push(entity);
            }
        });

        charactersToRest.forEach(character => {
            const health = HealthComponent.oneFrom(character);
            const mana = ManaComponent.oneFrom(character);

            if (health) {
                health.data.current = health.data.max;
            }
            if (mana) {
                mana.data.current = mana.data.max;
            }
        });

        this.eventBus.emit('playerStateModified', { characterId: playerEntity.id });
        console.log('[CampSystem] Party has rested. Health and mana restored.');
    }
}
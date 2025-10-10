import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { HealthComponent, ManaComponent, ControllableComponent } from '../components/character';
import { CompanionComponent } from '../components/npc';
import { GameSystem } from './GameSystem'; // <-- Import the new base class

/**
 * Handles non-combat, camp-related activities like resting.
 */
export class CampSystem extends GameSystem { // <-- Extend GameSystem

    constructor(world: ECS, eventBus: EventBus) {
        // Pass an empty array since this system doesn't iterate entities in an update loop
        super(world, eventBus, []);

        // Use the built-in subscribe method
        this.subscribe('restRequested', this.handleRest.bind(this));
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

        this.eventBus.emit('notification', {
            type: 'success',
            message: 'Your party feels well-rested.'
        });

        this.eventBus.emit('playerStateModified', { characterId: playerEntity.id });
    }
}
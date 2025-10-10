import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { PlayerLocationComponent, TravelTargetComponent, LocationComponent } from '../components/world';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Manages the player's movement between persistent locations (Zones and Hubs)
 * by responding to travel requests from the Application Layer.
 */
export class TravelSystem extends GameSystem { // Extend GameSystem
    private contentIdToEntityIdMap: Map<string, number>;

    constructor(world: ECS, eventBus: EventBus, contentIdToEntityIdMap: Map<string, number>) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;

        // Use the inherited 'subscribe' method
        this.subscribe('travelToNodeRequested', this.onTravelToNodeRequested.bind(this));
    }

    private onTravelToNodeRequested(payload: { characterId: number; nodeId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        const travelNode = this.world.getEntity(parseInt(payload.nodeId, 10));

        if (!character || !travelNode) {
            console.error(`TravelSystem: Could not find character or travel node.`);
            return;
        }

        const playerLocation = PlayerLocationComponent.oneFrom(character)?.data;
        const travelTarget = TravelTargetComponent.oneFrom(travelNode)?.data;

        if (!playerLocation || !travelTarget) {
            console.error(`TravelSystem: Missing required components for travel.`);
            return;
        }

        const newLocationContentId = travelTarget.targetLocationId;
        const newLocationEntityId = this.contentIdToEntityIdMap.get(newLocationContentId);
        const newLocationEntity = newLocationEntityId ? this.world.getEntity(newLocationEntityId) : undefined;

        if (!newLocationEntity) {
            console.error(`TravelSystem: Target location entity '${newLocationContentId}' not found.`);
            return;
        }

        const newLocationId = newLocationEntity.id.toString();
        const newLocationType = LocationComponent.oneFrom(newLocationEntity)?.data.type;

        if (newLocationType === 'Hub') {
            playerLocation.currentSubLocationId = newLocationId;
            console.log(`Player ${character.id} has traveled to Hub ${newLocationId}.`);
        } else {
            // Handle other travel types like Zone if needed
        }

        this.eventBus.emit('playerStateModified', {
            characterId: character.id,
        });
    }
}
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { PlayerLocationComponent, TravelTargetComponent, LocationComponent } from '../components/world';

/**
 * Manages the player's movement between persistent locations (Zones and Hubs)
 * by responding to travel requests from the Application Layer.
 */
export class TravelSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('travelToNodeRequested', this.onTravelToNodeRequested.bind(this));
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

        const newLocationId = travelTarget.targetLocationId;
        const newLocationEntity = this.world.getEntity(parseInt(newLocationId, 10));
        if (!newLocationEntity) {
            console.error(`TravelSystem: Target location entity '${newLocationId}' not found.`);
            return;
        }

        const newLocationType = LocationComponent.oneFrom(newLocationEntity)?.data.type;

        // --- CORE LOGIC IMPROVEMENT ---
        // Update the correct part of the player's location based on the type of destination.
        if (newLocationType === 'Zone') {
            playerLocation.currentZoneId = newLocationId;
            // When entering a new Zone, you might want to set the sub-location to a default hub.
            // For now, we'll assume the Zone itself is the initial sub-location.
            playerLocation.currentSubLocationId = newLocationId;
            console.log(`Player ${character.id} has traveled to Zone ${newLocationId}.`);
        } else if (newLocationType === 'Hub') {
            playerLocation.currentSubLocationId = newLocationId;
            // A Hub should always exist within a Zone. We can add a check here to ensure the parentZoneId
            // of the Hub matches the player's currentZoneId for consistency.
            console.log(`Player ${character.id} has traveled to Hub ${newLocationId}.`);
        }

        // Announce the change to the rest of the game.
        // We send the specific location ID they entered.
        this.eventBus.emit('playerLocationChanged', {
            characterId: character.id,
            newLocationId: newLocationId,
        });
    }
}
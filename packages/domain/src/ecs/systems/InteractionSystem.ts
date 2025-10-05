import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { TravelTargetComponent, InteractionTargetComponent } from '../components/world';

/**
 * Handles all player-initiated interactions with world nodes.
 * It acts as a router, delegating the action to the appropriate system.
 */
export class InteractionSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('interactWithNodeRequested', this.onInteractWithNodeRequested.bind(this));
    }

    private onInteractWithNodeRequested(payload: { characterId: number; nodeId: number }): void {
        const nodeEntity = this.world.getEntity(payload.nodeId);
        if (!nodeEntity) return;

        // Case 1: The node is a travel target
        const travelTarget = TravelTargetComponent.oneFrom(nodeEntity)?.data;
        if (travelTarget) {
            this.eventBus.emit('travelToNodeRequested', {
                characterId: payload.characterId,
                nodeId: String(payload.nodeId), // TravelSystem expects a string
            });
            return;
        }

        // Case 2: The node is an interaction target (Gather, Encounter, etc.)
        const interactionTarget = InteractionTargetComponent.oneFrom(nodeEntity)?.data;
        if (interactionTarget) {
            switch (interactionTarget.type) {
                case 'Gather':
                    this.eventBus.emit('gatherResourceRequested', {
                        characterId: payload.characterId,
                        lootTableId: interactionTarget.targetId,
                    });
                    break;
                // Other cases like 'Encounter' will be handled here later
            }
        }
    }
}

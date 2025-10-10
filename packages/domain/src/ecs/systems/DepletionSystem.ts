import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { NodeComponent } from '../components/world';

// Helper function
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Manages the lifecycle of depletable nodes, decrementing their uses
 * and resetting them once they are depleted.
 */
export class DepletionSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        // Listen for the generic interaction event
        this.eventBus.on('interactWithNodeRequested', this.onNodeInteraction.bind(this));
    }

    private onNodeInteraction(payload: { characterId: number; nodeId: number }): void {
        const nodeEntity = this.world.getEntity(payload.nodeId);
        if (!nodeEntity) return;

        const node = NodeComponent.oneFrom(nodeEntity)?.data;
        if (!node || !node.isDepletable || !node.uses) return;

        // Decrement uses
        node.usesRemaining = (node.usesRemaining ?? 1) - 1;

        if (node.usesRemaining <= 0) {
            // Node is depleted
            node.discovered = false; // Hide it from the map
            node.usesRemaining = randomNumber(node.uses[0], node.uses[1]); // Reset for next discovery

            this.eventBus.emit('notification', {
                type: 'info',
                message: `The ${node.name} has been depleted.`
            });
            // Force the hub state to refresh, which will make the node disappear from the UI
            this.eventBus.emit('playerLocationChanged', { characterId: payload.characterId, newLocationId: '' });

        } else {
            // Node still has uses
            this.eventBus.emit('notification', {
                type: 'info',
                message: `The ${node.name} has ${node.usesRemaining} uses remaining.`
            });

            // --- FIX: Force a hub state refresh to update the UI ---
            this.eventBus.emit('playerLocationChanged', { characterId: payload.characterId, newLocationId: '' });
        }
    }
}
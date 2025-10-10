import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { ContainerComponent, NodeComponent } from '../components/world';

/**
 * Handles the player's "Explore" action within a zone, revealing undiscovered nodes.
 */
export class ExplorationSystem {
    private world: ECS;
    private eventBus: EventBus;
    private contentIdToEntityIdMap: Map<string, number>;

    constructor(world: ECS, eventBus: EventBus, contentIdToEntityIdMap: Map<string, number>) {
        this.world = world;
        this.eventBus = eventBus;
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;

        this.eventBus.on('exploreRequested', this.onExploreRequested.bind(this));
    }

    private onExploreRequested(payload: { characterId: number; zoneId: string; }): void {
        const zoneEntity = this.world.getEntity(parseInt(payload.zoneId, 10));
        if (!zoneEntity) {
            console.error(`[ExplorationSystem] Zone with ID ${payload.zoneId} not found.`);
            return;
        }

        // --- Advance the game's time ---
        this.eventBus.emit('advanceTimeRequested', {}); // <-- Simplified call

        const container = ContainerComponent.oneFrom(zoneEntity)?.data;
        if (!container) return;

        // ... (rest of the logic remains the same)
        const undiscoveredNodes = container.containedEntityIds
            .map(contentId => {
                const entityId = this.contentIdToEntityIdMap.get(contentId);
                return entityId ? this.world.getEntity(entityId) : undefined;
            })
            .filter((entity): entity is Entity => {
                if (!entity) return false;
                const node = NodeComponent.oneFrom(entity)?.data;
                return !!(node && !node.discovered);
            });


        if (undiscoveredNodes.length === 0) {
            this.eventBus.emit('notification', {
                type: 'info',
                message: 'You have already discovered everything in this area.'
            });
            return;
        }

        const roll = Math.random();
        if (roll > 0.5) { // 50% chance to find something
            const nodeToDiscover = undiscoveredNodes[Math.floor(Math.random() * undiscoveredNodes.length)];
            const nodeComponent = NodeComponent.oneFrom(nodeToDiscover)!.data;

            nodeComponent.discovered = true;

            this.eventBus.emit('notification', {
                type: 'success',
                message: `You discovered a new location: ${nodeComponent.name}!`
            });

            this.eventBus.emit('playerLocationChanged', { characterId: payload.characterId, newLocationId: payload.zoneId });

        } else {
            this.eventBus.emit('notification', {
                type: 'info',
                message: 'You search the area but find nothing of interest.'
            });
        }
    }
}
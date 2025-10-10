// packages/domain/src/ecs/systems/ExplorationSystem.ts

import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { ContainerComponent, NodeComponent } from '../components/world';
import { QuestStatusComponent } from '../components/quest';
import { GameSystem } from './GameSystem';

/**
 * Handles the player's "Explore" action within a zone, which can result in
 * discovering a new node, triggering a random event, or finding nothing.
 */
export class ExplorationSystem extends GameSystem {
    private contentIdToEntityIdMap: Map<string, number>;
    private content: any;

    constructor(world: ECS, eventBus: EventBus, contentIdToEntityIdMap: Map<string, number>, loadedContent: any) {
        super(world, eventBus, []);
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;
        this.content = loadedContent;
        this.subscribe('exploreRequested', this.onExploreRequested.bind(this));
    }

    private onExploreRequested(payload: { characterId: number; zoneId: string; }): void {
        const zoneEntity = this.world.getEntity(parseInt(payload.zoneId, 10));
        if (!zoneEntity) {
            console.error(`[ExplorationSystem] Zone with ID ${payload.zoneId} not found.`);
            return;
        }

        this.eventBus.emit('advanceTimeRequested', {});

        // --- REVISED LOGIC STARTS HERE ---

        const roll = Math.random();
        let outcome: 'NODE' | 'EVENT' | 'NOTHING' = 'NOTHING';

        if (roll <= 0.40) {
            outcome = 'NODE';
        } else if (roll <= 0.70) {
            outcome = 'EVENT';
        }

        // --- Execute outcome ---

        if (outcome === 'NODE') {
            const container = ContainerComponent.oneFrom(zoneEntity)?.data;
            const undiscoveredNodes = (container?.containedEntityIds || [])
                .map(contentId => {
                    const entityId = this.contentIdToEntityIdMap.get(contentId);
                    return entityId ? this.world.getEntity(entityId) : undefined;
                })
                .filter((entity): entity is Entity => {
                    if (!entity) return false;
                    const node = NodeComponent.oneFrom(entity)?.data;
                    return !!(node && !node.discovered);
                });

            if (undiscoveredNodes.length > 0) {
                // Successfully discover a node
                const nodeToDiscover = undiscoveredNodes[Math.floor(Math.random() * undiscoveredNodes.length)];
                const nodeComponent = NodeComponent.oneFrom(nodeToDiscover)!.data;
                nodeComponent.discovered = true;

                this.eventBus.emit('notification', {
                    type: 'success',
                    message: `You discovered a new location: ${nodeComponent.name}!`
                });

                this.eventBus.emit('playerLocationChanged', { characterId: payload.characterId, newLocationId: payload.zoneId });
            } else {
                // No nodes were left, so this outcome becomes "Nothing"
                this.eventBus.emit('notification', {
                    type: 'info',
                    message: 'You search the area but find nothing of interest.'
                });
            }
        } else if (outcome === 'EVENT') {
            this.triggerRandomEvent(payload.zoneId, payload.characterId);
        } else { // outcome === 'NOTHING'
            this.eventBus.emit('notification', {
                type: 'info',
                message: 'You search the area but find nothing of interest.'
            });
        }
    }

    private triggerRandomEvent(zoneId: string, characterId: number): void {
        const character = this.world.getEntity(characterId);
        if (!character) return;
        console.log("[ExplorationSystem] Event Triggered")

        // 1. Find the event pool for the current zone
        let zoneContentId: string | undefined;
        for (const [key, val] of this.contentIdToEntityIdMap.entries()) {
            if (val === parseInt(zoneId, 10)) {
                zoneContentId = key;
                break;
            }
        }
        if (!zoneContentId) return;

        const eventPoolId = `pool_${zoneContentId.replace('loc_', '')}`;
        const eventPool = this.content.explorationEvents?.get(eventPoolId);
        if (!eventPool || !eventPool.events || eventPool.events.length === 0) {
            this.eventBus.emit('notification', { type: 'info', message: 'You search the area but find nothing of interest.' });
            return;
        }

        // 2. Filter events based on prerequisites (e.g., active quests)
        const possibleEvents = eventPool.events.filter((event: any) => {
            if (!event.prerequisites) return true; // Always possible if no prerequisites

            return event.prerequisites.every((prereq: any) => {
                if (prereq.type === 'QUEST_STATUS') {
                    const questStatus = QuestStatusComponent.allFrom(character)
                        .find(q => q.data.questId === prereq.questId);
                    return questStatus?.data.status === prereq.status;
                }
                // Future prerequisite types (e.g., checking inventory) could be added here
                return false;
            });
        });

        if (possibleEvents.length === 0) {
            this.eventBus.emit('notification', { type: 'info', message: 'You search the area but find nothing of interest.' });
            return;
        }

        // 3. Perform a weighted roll to select an event
        const totalWeight = possibleEvents.reduce((sum: number, event: any) => sum + event.weight, 0);
        let randomRoll = Math.random() * totalWeight;

        let selectedEvent: any;
        for (const event of possibleEvents) {
            randomRoll -= event.weight;
            if (randomRoll <= 0) {
                selectedEvent = event;
                break;
            }
        }

        if (!selectedEvent) {
            // Fallback in case of rounding errors, pick the last one
            selectedEvent = possibleEvents[possibleEvents.length - 1];
        }

        // 4. Execute the selected event's outcome
        this.executeEvent(character, selectedEvent);
    }

    private executeEvent(character: Entity, event: any): void {
        const payload = event.payload;

        // For most events, we just want to show a modal/notification to the player.
        // We'll use a simple notification for now.
        this.eventBus.emit('notification', {
            type: event.type === 'TRAP' ? 'warn' : 'info',
            message: `[${payload.title}] ${payload.text}`
        });

        // Handle specific game logic updates
        switch (event.type) {
            case 'TRAP':
                if (payload.damage) {
                    this.eventBus.emit('damageDealt', {
                        attackerId: 'WORLD', // Or a generic ID for environmental damage
                        targetId: character.id.toString(),
                        damage: payload.damage,
                        isCritical: false,
                    });
                }
                break;

            case 'QUEST_OBJECTIVE':
                // We fire a specific event for the QuestTrackingSystem to handle.
                this.eventBus.emit('explorationQuestEventTriggered', {
                    characterId: character.id,
                    questId: payload.questId,
                    objectiveTargetId: payload.objectiveTargetId,
                });
                break;
        }
    }
}
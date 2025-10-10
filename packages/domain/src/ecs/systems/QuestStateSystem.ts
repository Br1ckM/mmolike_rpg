import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { QuestStateTriggerComponent } from '../components/quest';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Listens for quest status changes and enacts changes in the game world,
 * such as spawning or despawning entities.
 */
export class QuestStateSystem extends GameSystem { // Extend GameSystem
    private content: any; // To access entity templates for spawning
    // --- FIX: This system needs the content map to find quest entities ---
    private contentIdToEntityIdMap: Map<string, number>;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any, contentIdToEntityIdMap: Map<string, number>) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.content = loadedContent;
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;

        // Use the inherited 'subscribe' method
        this.subscribe('questAccepted', (payload) => this.handleStateChange(payload.questId, 'in_progress'));
        this.subscribe('questCompleted', (payload) => this.handleStateChange(payload.questId, 'completed'));
        this.subscribe('questTurnedIn', (payload) => this.handleStateChange(payload.questId, 'turned_in'));
    }

    /**
     * A generic handler that checks a quest for any triggers matching the new status.
     */
    private handleStateChange(questId: string, newStatus: 'in_progress' | 'completed' | 'turned_in'): void {
        // --- FIX: Use the map to find the quest entity by its string ID ---
        const questEntityId = this.contentIdToEntityIdMap.get(questId);
        const questEntity = questEntityId ? this.world.getEntity(questEntityId) : undefined;
        // --- END FIX ---

        if (!questEntity) return;

        const triggers = QuestStateTriggerComponent.oneFrom(questEntity)?.data;
        if (!triggers) return;

        for (const trigger of triggers) {
            if (trigger.status === newStatus) {
                this.executeTriggerAction(trigger);
            }
        }
    }

    /**
     * Executes the specific world action defined by a trigger.
     */
    private executeTriggerAction(trigger: { action: string; targetId: string; }): void {
        switch (trigger.action) {
            case 'SPAWN_ENTITY':
                this.spawnEntity(trigger.targetId);
                break;
            // You could add more cases here like 'DESPAWN_ENTITY'
            default:
                console.warn(`Unknown quest state trigger action: ${trigger.action}`);
        }
    }

    /**
     * Spawns a new entity into the world based on its template ID.
     * This is a conceptual implementation.
     */
    private spawnEntity(entityTemplateId: string): void {
        // In a real implementation, you would look up the full entity data
        // from your loaded content and create a new instance of it.
        console.log(`[QuestStateSystem] Action triggered: SPAWN_ENTITY with ID '${entityTemplateId}'.`);
    }
}
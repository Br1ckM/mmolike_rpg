import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { Character } from '../entities/character';
import { QuestStateTriggerComponent } from '../components/quest';

/**
 * Listens for quest status changes and enacts changes in the game world,
 * such as spawning or despawning entities.
 */
export class QuestStateSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: any; // To access entity templates for spawning

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent; // e.g., a map of all character templates

        // This system listens to all relevant quest lifecycle events.
        this.eventBus.on('questAccepted', (payload) => this.handleStateChange(payload.questId, 'in_progress'));
        this.eventBus.on('questCompleted', (payload) => this.handleStateChange(payload.questId, 'completed'));
        this.eventBus.on('questTurnedIn', (payload) => this.handleStateChange(payload.questId, 'turned_in'));
    }

    /**
     * A generic handler that checks a quest for any triggers matching the new status.
     */
    private handleStateChange(questId: string, newStatus: 'in_progress' | 'completed' | 'turned_in'): void {
        const questEntity = this.world.getEntity(parseInt(questId, 10));
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
        // For example:
        // const enemyData = this.content.characters.get(entityTemplateId);
        // if (enemyData) {
        //     const newEnemy = new Character(enemyData.components);
        //     this.world.addEntity(newEnemy);
        // }

        console.log(`[QuestStateSystem] Action triggered: SPAWN_ENTITY with ID '${entityTemplateId}'.`);
    }
}
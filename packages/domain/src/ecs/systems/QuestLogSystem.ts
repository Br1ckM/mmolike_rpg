import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import {
    QuestStatusComponent,
    QuestObjectiveComponent,
    QuestStatusData
} from '../components/quest';

/**
 * Manages the lifecycle of quests for characters. It adds quests to a character's "log",
 * updates their state, and determines when they are completed.
 */
export class QuestLogSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('questAccepted', this.onQuestAccepted.bind(this));
        this.eventBus.on('questTurnedIn', this.onQuestTurnedIn.bind(this));
    }

    /**
     * Adds a new quest to the character's log.
     */
    private onQuestAccepted(payload: { characterId: number; questId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        // Corrected: Parse the string ID to a number for entity lookup.
        const questEntity = this.world.getEntity(parseInt(payload.questId, 10));

        if (!character || !questEntity) {
            console.error(`Could not accept quest: Character or Quest entity not found.`);
            return;
        }

        const objectives = QuestObjectiveComponent.oneFrom(questEntity)?.data;
        if (!objectives) return;

        // Create the initial progress tracker for the character
        const statusData: QuestStatusData = {
            questId: payload.questId,
            status: 'in_progress',
            // Initialize progress for all objectives to 0
            objectiveProgress: new Array(objectives.length).fill(0),
        };

        character.add(new QuestStatusComponent(statusData));
        console.log(`Quest '${payload.questId}' accepted by character ${payload.characterId}.`);
    }

    /**
     * Public method for other systems (like QuestTrackingSystem) to call.
     * Updates the progress of a single objective.
     */
    public updateObjectiveProgress(character: Entity, questId: string, objectiveIndex: number, amount: number): void {
        const questStatuses = QuestStatusComponent.allFrom(character);
        const questStatus = questStatuses.find(q => q.data.questId === questId);

        if (!questStatus || questStatus.data.status !== 'in_progress') return;

        questStatus.data.objectiveProgress[objectiveIndex] += amount;

        console.log(`Quest '${questId}' progress updated for objective ${objectiveIndex}.`);
        this.eventBus.emit('questProgressUpdated', { characterId: character.id, questId: questId });

        this.checkForQuestCompletion(character, questStatus.data);
    }

    /**
     * Checks if all objectives for a quest are met.
     */
    private checkForQuestCompletion(character: Entity, statusData: QuestStatusData): void {
        // Corrected: Parse the string ID to a number for entity lookup.
        const questEntity = this.world.getEntity(parseInt(statusData.questId, 10));

        // Corrected: Add a null check for the quest entity.
        if (!questEntity) return;

        const objectives = QuestObjectiveComponent.oneFrom(questEntity)?.data;

        if (!objectives) return;

        const isCompleted = objectives.every((obj, index) => {
            return statusData.objectiveProgress[index] >= obj.requiredAmount;
        });

        if (isCompleted) {
            statusData.status = 'completed';
            console.log(`Quest '${statusData.questId}' completed by character ${character.id}.`);
            this.eventBus.emit('questCompleted', { characterId: character.id, questId: statusData.questId });
        }
    }

    /**
     * Marks the quest as turned in and removes it from the active log.
     */
    private onQuestTurnedIn(payload: { characterId: number; questId: string; }): void {
        const character = this.world.getEntity(payload.characterId);

        // Corrected: Add a null check for the character entity.
        if (!character) return;

        const questStatus = QuestStatusComponent.allFrom(character).find(q => q.data.questId === payload.questId);

        if (questStatus && questStatus.data.status === 'completed') {
            // Instead of removing, we mark as turned_in to keep a record of completed quests.
            // You could also remove it if you don't need that history.
            questStatus.data.status = 'turned_in';
            console.log(`Quest '${payload.questId}' turned in by character ${payload.characterId}.`);
        }
    }
}
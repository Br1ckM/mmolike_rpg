import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { QuestLogSystem } from './QuestLogSystem';
import {
    QuestStatusComponent,
    QuestObjectiveComponent
} from '../components/quest';

/**
 * Listens for generic game events (like defeating an enemy) and translates them
 * into quest progress by notifying the QuestLogSystem.
 */
export class QuestTrackingSystem {
    private world: ECS;
    private eventBus: EventBus;
    private questLogSystem: QuestLogSystem;
    private contentIdToEntityIdMap: Map<string, number>;

    constructor(world: ECS, eventBus: EventBus, questLogSystem: QuestLogSystem, contentIdToEntityIdMap: Map<string, number>) {
        this.world = world;
        this.eventBus = eventBus;
        this.questLogSystem = questLogSystem;
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;

        // Listen for events that can advance quests
        this.eventBus.on('enemyDefeated', this.onEnemyDefeated.bind(this));
        this.eventBus.on('itemPickedUp', this.onItemPickedUp.bind(this));
    }

    /**
     * Handles the 'enemyDefeated' event to check for 'kill' objectives.
     */
    private onEnemyDefeated(payload: { enemyId: string; characterId: number; level: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        // Find all 'in_progress' quests for this character
        const activeQuests = QuestStatusComponent.allFrom(character)
            .filter(status => status.data.status === 'in_progress');

        for (const questStatus of activeQuests) {
            const questEntityId = this.contentIdToEntityIdMap.get(questStatus.data.questId);
            const questEntity = questEntityId ? this.world.getEntity(questEntityId) : undefined;
            if (!questEntity) continue;

            const objectives = QuestObjectiveComponent.oneFrom(questEntity)?.data;
            if (!objectives) continue;

            // Check each objective to see if it matches the defeated enemy
            objectives.forEach((objective, index) => {
                if (objective.type === 'kill' && objective.targetId === payload.enemyId) {
                    // Tell the QuestLogSystem to update the progress
                    this.questLogSystem.updateObjectiveProgress(
                        character,
                        questStatus.data.questId,
                        index,
                        1 // Increment by 1
                    );
                }
            });
        }
    }

    private onItemPickedUp(payload: { characterId: number; itemBaseId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        const activeQuests = QuestStatusComponent.allFrom(character)
            .filter(status => status.data.status === 'in_progress');

        for (const questStatus of activeQuests) {
            const questEntityId = this.contentIdToEntityIdMap.get(questStatus.data.questId);
            const questEntity = questEntityId ? this.world.getEntity(questEntityId) : undefined;
            if (!questEntity) continue;

            const objectives = QuestObjectiveComponent.oneFrom(questEntity)?.data;
            if (!objectives) continue;

            objectives.forEach((objective, index) => {
                if (objective.type === 'fetch' && objective.targetId === payload.itemBaseId) {
                    // Tell the QuestLogSystem to update the progress
                    this.questLogSystem.updateObjectiveProgress(
                        character,
                        questStatus.data.questId,
                        index,
                        1 // This assumes you are tracking quantity; for now, 1 is sufficient
                    );
                }
            });
        }
    }
}
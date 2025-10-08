import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { DialogueComponent } from '../components/npc';
import type { DialogueTree, DialogueNode, DialogueAction, DialogueResponse, DialogueCondition } from '../components/dialogue';
import { QuestStatusComponent } from '../components/quest';
import { InfoComponent } from '../components/character';

type HistoryEntry = { speaker: 'NPC' | 'Player'; text: string };

/**
 * Manages the flow of conversations between players and NPCs. It interprets
 * DialogueTree data structures to present choices and trigger game events.
 */
export class DialogueSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: { dialogueTrees: Map<string, DialogueTree> };

    // State for the currently active conversation
    private activeConversation: {
        characterId: number;
        npcId: number;
        tree: DialogueTree;
        currentNode: DialogueNode;
        history: HistoryEntry[];
    } | null = null;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent; // Assumes dialogueTrees are loaded here

        // Events from the Application Layer
        this.eventBus.on('dialogueInitiated', this.onDialogueInitiated.bind(this));
        this.eventBus.on('dialogueResponseSelected', this.onResponseSelected.bind(this));
    }

    private onDialogueInitiated(payload: { characterId: number; npcId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        const npc = this.world.getEntity(payload.npcId);
        if (!character || !npc) return;

        const dialogueComponent = DialogueComponent.oneFrom(npc)?.data;
        const dialogueTreeId = dialogueComponent?.dialogueTreeId;
        if (!dialogueTreeId) return;

        const tree = this.content.dialogueTrees.get(dialogueTreeId);
        if (!tree) {
            console.error(`Dialogue tree '${dialogueTreeId}' not found.`);
            return;
        }

        const startNode = tree.nodes[tree.startNodeId];
        const initialHistory: HistoryEntry[] = [{ speaker: 'NPC', text: startNode.text }]; // <-- Initialize history

        this.activeConversation = {
            ...payload,
            tree,
            currentNode: startNode,
            history: initialHistory,
        };

        const npcInfo = InfoComponent.oneFrom(npc)?.data;
        const npcName = npcInfo?.name || "Unknown";
        const npcAvatarUrl = npcInfo?.avatarUrl || "";

        // Emit an event to the UI to display the dialogue
        this.eventBus.emit('dialogueNodeChanged', {
            npcName,
            npcAvatarUrl,
            text: startNode.text,
            responses: this.getAvailableResponses(startNode, character),
            history: initialHistory,
        });
    }

    private onResponseSelected(payload: { responseIndex: number; }): void {
        if (!this.activeConversation) return;

        const { currentNode, characterId, npcId, history } = this.activeConversation;
        const character = this.world.getEntity(characterId);
        const npc = this.world.getEntity(npcId);
        if (!character || !npc) return;

        const availableResponses = this.getAvailableResponses(currentNode, character); // Corrected call
        const selectedResponse = availableResponses[payload.responseIndex];

        if (!selectedResponse) return;

        history.push({ speaker: 'Player', text: selectedResponse.text });

        // Step 1: Execute any actions associated with the choice
        if (selectedResponse.actions) {
            selectedResponse.actions.forEach(action => this.executeAction(action, characterId, npcId)); // Corrected call
        }

        // Step 2: Move to the next node
        const nextNodeId = selectedResponse.nextNodeId;
        if (nextNodeId === 'END') {
            this.endConversation();
            return;
        }

        const nextNode = this.activeConversation.tree.nodes[nextNodeId];
        history.push({ speaker: 'NPC', text: nextNode.text });

        this.activeConversation.currentNode = nextNode;
        const npcInfo = InfoComponent.oneFrom(npc)?.data;
        const npcName = npcInfo?.name || "Unknown";
        const npcAvatarUrl = npcInfo?.avatarUrl || "";


        this.eventBus.emit('dialogueNodeChanged', {
            npcName,
            npcAvatarUrl,
            text: nextNode.text,
            responses: this.getAvailableResponses(nextNode, character), // Corrected call
            history: history,
        });
    }

    private executeAction(action: DialogueAction, characterId: number, npcId: number): void {
        switch (action.type) {
            case 'GIVE_QUEST':
                if (action.questId) {
                    this.eventBus.emit('questAccepted', {
                        characterId,
                        questId: action.questId
                    });
                }
                break;
            case 'OPEN_VENDOR':
                this.eventBus.emit('vendorScreenOpened', { characterId, npcId });
                break;
            case 'START_TRAINING':
                this.eventBus.emit('trainingScreenOpened', { characterId, npcId });
                break;
            case 'RECRUIT_COMPANION':
                this.eventBus.emit('companionRecruited', { characterId, npcId });
                break;
        }
    }

    private getAvailableResponses(node: DialogueNode, character: Entity): DialogueResponse[] {
        return node.responses.filter(response => {
            if (!response.conditions) {
                return true; // No conditions, always available
            }

            // Check all conditions for this response
            return response.conditions.every(condition => {
                switch (condition.type) {
                    case 'QUEST_STATUS':
                        const questStatus = QuestStatusComponent.allFrom(character)
                            .find(q => q.data.questId === condition.questId);

                        // If the quest isn't in their log at all, check if the condition is for 'available'
                        if (!questStatus) {
                            return condition.status === 'available';
                        }

                        // If the quest is in their log, check if the status matches
                        return questStatus?.data.status === condition.status;
                    default:
                        return false;
                }
            });
        });
    }

    private endConversation(): void {
        this.activeConversation = null;
        this.eventBus.emit('dialogueEnded', {});
    }
}
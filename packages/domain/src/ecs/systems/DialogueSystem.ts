import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { DialogueComponent } from '../components/npc';
import type { DialogueTree, DialogueNode, DialogueAction, DialogueResponse, DialogueCondition } from '../components/dialogue';
import { QuestStatusComponent } from '../components/quest';
import { InfoComponent } from '../components/character';
import { GameSystem } from './GameSystem'; // Import the new base class

type HistoryEntry = { speaker: 'NPC' | 'Player'; text: string };

/**
 * Manages the flow of conversations between players and NPCs. It interprets
 * DialogueTree data structures to present choices and trigger game events.
 */
export class DialogueSystem extends GameSystem { // Extend GameSystem
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
        // This system is event-driven, so it doesn't need to iterate components.
        super(world, eventBus, []);
        this.content = loadedContent;

        // Use the inherited 'subscribe' method
        this.subscribe('dialogueInitiated', this.onDialogueInitiated.bind(this));
        this.subscribe('dialogueResponseSelected', this.onResponseSelected.bind(this));
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
        const initialHistory: HistoryEntry[] = [{ speaker: 'NPC', text: startNode.text }];

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

        const availableResponses = this.getAvailableResponses(currentNode, character);
        const selectedResponse = availableResponses[payload.responseIndex];

        if (!selectedResponse) return;

        history.push({ speaker: 'Player', text: selectedResponse.text });

        if (selectedResponse.actions) {
            selectedResponse.actions.forEach(action => this.executeAction(action, characterId, npcId));
        }

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
            responses: this.getAvailableResponses(nextNode, character),
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
                return true;
            }

            return response.conditions.every(condition => {
                switch (condition.type) {
                    case 'QUEST_STATUS':
                        const questStatus = QuestStatusComponent.allFrom(character)
                            .find(q => q.data.questId === condition.questId);

                        if (!questStatus) {
                            return condition.status === 'available';
                        }

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
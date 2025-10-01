/**
 * Represents a single piece of NPC dialogue and the player's possible responses.
 */
export interface DialogueNode {
    /** The unique identifier for this node within the tree. */
    id: string;
    /** The text the NPC says for this node. */
    text: string;
    /** The list of choices the player can make. */
    responses: DialogueResponse[];
}

/**
 * Represents a single choice a player can make in response to NPC dialogue.
 */
export interface DialogueResponse {
    /** The text the player sees for this choice. */
    text: string;
    /** The ID of the next dialogue node to jump to. If 'END', the conversation terminates. */
    nextNodeId: string;
    /** Optional conditions that must be met for this response to be visible. */
    conditions?: DialogueCondition[];
    /** Actions to be executed if the player chooses this response. */
    actions?: DialogueAction[];
}

/**
 * An action triggered by a player's dialogue choice. This is how dialogue
 * connects to and influences other game systems.
 */
export interface DialogueAction {
    type: 'GIVE_QUEST' | 'OPEN_VENDOR' | 'START_TRAINING';
    /** The ID of the quest to give, or other relevant context. */
    questId?: string;
}

/**
 * A condition that must be met for a dialogue node or response to be available.
 */
export interface DialogueCondition {
    type: 'QUEST_STATUS';
    questId: string;
    status: 'available' | 'in_progress' | 'completed';
}

/**
 * Represents an entire branching conversation. This is the top-level object
 * that will be defined in a YAML file.
 */
export interface DialogueTree {
    id: string;
    /** The ID of the first node to display when the conversation starts. */
    startNodeId: string;
    /** A map of all nodes in this conversation, keyed by their ID. */
    nodes: Record<string, DialogueNode>;
}
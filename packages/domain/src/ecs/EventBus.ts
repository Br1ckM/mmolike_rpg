import type { EquipmentSlot } from "./components/character";
import type { DialogueResponse } from "./components/dialogue";

// Define the structure for all possible event payloads
interface EventMap {
    'playerStateModified': { characterId: number; };
    'enemyDefeated': { enemyId: string; characterId: number; };
    'lootContainerOpened': { containerId: string; characterId: number; };
    'generateItemRequest': { baseItemId: string; characterId: number; };
    'addItemToInventory': { characterId: number; itemEntityId: number; };
    'inventoryFull': { characterId: number; itemEntityId: number; };
    'equipItemRequest': { characterId: number; itemEntityId: number; };
    'unequipItemRequest': { characterId: number; slot: EquipmentSlot; };
    'characterEquipmentChanged': { characterId: number; };
    'useConsumableRequest': { characterId: number; itemEntityId: number; };
    'removeItemFromInventory': {
        characterId: number;
        itemEntityId: number;
        reason: 'consume' | 'drop' | 'equip'; // Context for the removal
    };
    'itemRemovedForEquip': { characterId: number; itemEntityId: number; };
    'questAccepted': { characterId: number; questId: string; };
    'questProgressUpdated': { characterId: number; questId: string; };
    'questCompleted': { characterId: number; questId: string; };
    'questTurnedIn': { characterId: number; questId: string; };
    'itemPickedUp': { characterId: number; itemBaseId: string; };
    'dialogueInitiated': { characterId: number; npcId: number; };
    'dialogueResponseSelected': { responseIndex: number; };
    'dialogueNodeChanged': {
        npcName: string;
        npcAvatarUrl: string;
        text: string;
        responses: DialogueResponse[];
        history: { speaker: 'NPC' | 'Player'; text: string }[]; // <-- ADD THIS
    };
    'dialogueEnded': {};
    'vendorScreenOpened': { characterId: number; npcId: number; };
    'trainingScreenOpened': { characterId: number; npcId: number; };
    'buyItemRequested': { characterId: number; npcId: number; itemEntityId: number; };
    'sellItemRequested': { characterId: number; npcId: number; itemEntityId: number; };
    'vendorInventoryUpdated': { vendorItems: any[], playerSellableItems: any[] };
    'learnSkillRequested': { characterId: number; npcId: number; skillId: string; };
    'unlockJobRequested': { characterId: number; npcId: number; jobId: string; };
    'skillLearned': { characterId: number; skillId: string; success: boolean; };
    'timeOfDayChanged': { newTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night'; };
    'npcLocationChanged': { npcId: number; newLocationId: string; };
    'advanceTimeRequested': { from: 'Morning' | 'Afternoon' | 'Evening' | 'Night'; };
    'travelToNodeRequested': { characterId: number; nodeId: string; };
    'playerLocationChanged': { characterId: number; newLocationId: string; };
    'interactWithNodeRequested': { characterId: number, nodeId: number };
    'gatherResourceRequested': { characterId: number, lootTableId: string };
    'startCombatEncounter': {
        team1: { entityId: string; initialRow: 'Front' | 'Back'; }[]; // e.g., The player's party
        team2: { entityId: string; initialRow: 'Front' | 'Back'; }[]; // e.g., The enemy group
    };

    /** Fired by CombatInitiationSystem when the battle has been set up. */
    'combatStarted': { combatEntityId: string; combatants: string[]; };

    /** Fired by the CombatSystem to announce the start of a new round. */
    'roundStarted': { combatEntityId: string; roundNumber: number; };

    /** Fired by the CombatSystem to announce whose turn it is. */
    'turnStarted': { combatEntityId: string; activeCombatantId: string; };

    /** Fired by the CombatSystem when one side has been defeated. */
    'combatEnded': { combatEntityId: string; winningTeamId: string; };

    'actionTaken': {
        combatEntityId: string;
        actorId: string;
        actionType: 'SKILL' | 'MOVE_ROW';
        skillId?: string;
        targetId?: string;
    };

    /** Fired by the CombatSystem to announce the result of an action. */
    'damageDealt': {
        attackerId: string;
        targetId: string;
        damage: number;
        isCritical: boolean;
    };

    /** Fired by the CombatSystem when a target is healed. */
    'healthHealed': {
        healerId: string;
        targetId: string;
        amount: number;
    };

    /** Fired by the CombatSystem when a status effect is applied. */
    'effectApplied': {
        sourceId: string;
        targetId: string;
        effectId: string;
    };

    /** Fired by the CombatSystem when a turn has been fully resolved. */
    'turnEnded': { combatEntityId: string; endedTurnForId: string; };
    'fleeAttempt': { combatEntityId: string; actorId: string; };
    'startEncounterRequest': {
        team1: { entityId: string; initialRow: 'Front' | 'Back'; }[];
        encounterId: string; // The ID of the encounter to be spawned
    };
    'notification': {
        type: 'info' | 'success' | 'error' | 'warn';
        message: string;
    };
}

type EventKey = keyof EventMap;

// A simple type-safe event handler
type EventHandler<T> = (payload: T) => void;

export class EventBus {
    private listeners: { [K in EventKey]?: EventHandler<EventMap[K]>[] } = {};

    /**
     * Subscribes a handler to an event.
     * @param key The event to listen for.
     * @param handler The function to call when the event is emitted.
     */
    on<K extends EventKey>(key: K, handler: EventHandler<EventMap[K]>): void {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key]!.push(handler);
    }

    /**
     * Emits an event to all registered listeners.
     * @param key The event to emit.
     * @param payload The data to send with the event.
     */
    emit<K extends EventKey>(key: K, payload: EventMap[K]): void {
        const handlers = this.listeners[key];
        if (handlers) {
            handlers.forEach(handler => handler(payload));
        }
    }
}
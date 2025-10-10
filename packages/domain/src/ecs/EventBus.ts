import type { EquipmentSlot, VoreRole } from "./components/character";
import type { DialogueResponse } from "./components/dialogue";

// Define the structure for all possible event payloads
interface EventMap {
    // Player / Character events
    'playerStateModified': { characterId: number; };
    'experienceGained': { characterId: number; amount: number; };
    'playerLeveledUp': { characterId: number; newLevel: number; };
    'characterCreationRequested': {
        name: string;
        pronouns: string;
        ancestryId: string;
    };

    // Combat / Encounter events
    'startCombatEncounter': {
        team1: { entityId: string; initialRow: 'Front' | 'Back'; }[]; // e.g., The player's party
        team2: { entityId: string; initialRow: 'Front' | 'Back'; }[]; // e.g., The enemy group
    };
    'enemyDefeated': { enemyId: string; characterId: number; level: number; }; // <-- restored here
    'combatStarted': { combatEntityId: string; combatants: string[]; };
    'roundStarted': { combatEntityId: string; roundNumber: number; };
    'turnStarted': { combatEntityId: string; activeCombatantId: string; };
    'actionTaken': {
        combatEntityId: string;
        actorId: string;
        actionType: 'SKILL' | 'MOVE_ROW' | 'ITEM';
        skillId?: string;
        targetId?: string;
    };
    'damageDealt': {
        attackerId: string;
        targetId: string;
        damage: number;
        isCritical: boolean;
    };
    'healthHealed': {
        healerId: string;
        targetId: string;
        amount: number;
    };
    'effectApplied': {
        sourceId: string;
        targetId: string;
        effectId: string;
    };
    'turnEnded': { combatEntityId: string; endedTurnForId: string; };
    'fleeAttempt': { combatEntityId: string; actorId: string; };
    'combatEnded': { combatEntityId: string; winningTeamId: string; };
    'startEncounterRequest': {
        team1: { entityId: string; initialRow: 'Front' | 'Back'; }[];
        encounterId: string; // The ID of the encounter to be spawned
    };

    // Inventory / Items
    'generateItemRequest': { baseItemId: string; characterId: number; itemLevel: number; };
    'addItemToInventory': { characterId: number; itemEntityId: number; baseItemId: string; };
    'inventoryFull': { characterId: number; itemEntityId: number; };
    'equipItemRequest': { characterId: number; itemEntityId: number; };
    'unequipItemRequest': { characterId: number; slot: EquipmentSlot; };
    'characterEquipmentChanged': { characterId: number; };
    'useConsumableRequest': { characterId: number; itemEntityId: number; };
    'useItemInBeltRequest': { characterId: number; beltIndex: number; combatEntityId?: string; };
    'removeItemFromInventory': {
        characterId: number;
        itemEntityId: number;
        quantity: number;
        reason: 'consume' | 'drop' | 'equip';
    };
    'itemRemovedForEquip': { characterId: number; itemEntityId: number; };
    'itemPickedUp': { characterId: number; itemBaseId: string; };

    // Loot / Containers / Gathering
    'lootContainerOpened': { containerId: string; characterId: number; };
    'gatherResourceRequested': { characterId: number; lootTableId: string; };

    // Quests
    'questAccepted': { characterId: number; questId: string; };
    'questProgressUpdated': { characterId: number; questId: string; };
    'questCompleted': { characterId: number; questId: string; };
    'questTurnedIn': { characterId: number; questId: string; };

    // Dialogue / NPC interactions
    'dialogueInitiated': { characterId: number; npcId: number; };
    'dialogueResponseSelected': { responseIndex: number; };
    'dialogueNodeChanged': {
        npcName: string;
        npcAvatarUrl: string;
        text: string;
        responses: DialogueResponse[];
        history: { speaker: 'NPC' | 'Player'; text: string }[];
    };
    'dialogueEnded': {};

    // Party / Companion
    'companionRecruited': { characterId: number; npcId: number; };
    'partyUpdated': { characterId: number; };
    'swapCompanionRequested': { characterId: number; companionId: number; };

    // Vendor / Training
    'vendorScreenOpened': { characterId: number; npcId: number; };
    'trainingScreenOpened': { characterId: number; npcId: number; };
    'buyItemRequested': { characterId: number; npcId: number; itemEntityId: number; };
    'sellItemRequested': { characterId: number; npcId: number; itemEntityId: number; };
    'vendorInventoryUpdated': { vendorItems: any[]; playerSellableItems: any[]; };
    'learnSkillRequested': { characterId: number; npcId: number; skillId: string; };
    'unlockJobRequested': { characterId: number; npcId: number; jobId: string; };
    'skillLearned': { characterId: number; skillId: string; success: boolean; };

    // World / Time / Travel
    'timeOfDayChanged': { newTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night'; };
    'advanceTimeRequested': {
        increments?: number,
        to?: 'Morning' | 'Afternoon' | 'Evening' | 'Night'
    }; //
    'travelToNodeRequested': { characterId: number; nodeId: string; };
    'playerLocationChanged': { characterId: number; newLocationId: string; };
    'npcLocationChanged': { npcId: number; newLocationId: string; };
    'interactWithNodeRequested': { characterId: number; nodeId: number; };
    'restRequested': { characterId: number };
    'exploreRequested': { characterId: number; zoneId: string; };
    'nodeDiscovered': { characterId: number; nodeId: number; nodeName: string; };

    // Content filter / Preferences
    'contentFilterChanged': { showNsfwContent: boolean; showVoreContent: boolean; };
    'updateContentFilter': { showNsfwContent: boolean; showVoreContent: boolean; };
    'setPlayerVoreRoleRequest': { characterId: number; newRole: VoreRole; };
    'setPlayerVoreRole': { characterId: number; newRole: VoreRole; };

    // Notifications / Misc
    'notification': { type: 'info' | 'success' | 'error' | 'warn'; message: string; };

    // Vore-related events
    'preyDevoured': { predatorId: number; preyId: number; };
    'preyDigested': { predatorId: number; digestedPreyData: any; };
    'regurgitateRequest': { predatorId: number; }; // <-- fixed missing semicolon previously
    'dev_addPreyToStomach': { // developer / debug event
        playerId: number;
        preyData: {
            name: string;
            size: number;
            digestionTime: number;
            nutritionValue: number;
            strugglePower: number;
        };
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
    on<K extends EventKey>(key: K, handler: EventHandler<EventMap[K]>): () => void {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key]!.push(handler);

        // Return an unsubscribe function so callers can remove their listener.
        return () => {
            const handlers = this.listeners[key];
            if (!handlers) return;
            const idx = handlers.indexOf(handler as EventHandler<EventMap[K]>);
            if (idx !== -1) handlers.splice(idx, 1);
        };
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


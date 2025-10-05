import { EventBus } from '../../domain/src/ecs/EventBus';

/**
 * Provides methods for the Presentation Layer to issue player commands.
 * This service translates UI interactions into domain-level events.
 */
export class CommandService {
    private domainEventBus: EventBus;

    constructor(domainEventBus: EventBus) {
        this.domainEventBus = domainEventBus;
    }

    // --- Interaction Commands ---

    public initiateDialogue(characterId: number, npcId: number): void {
        this.domainEventBus.emit('dialogueInitiated', { characterId, npcId });
    }

    public selectDialogueResponse(responseIndex: number): void {
        this.domainEventBus.emit('dialogueResponseSelected', { responseIndex });
    }

    public startEncounter(characterId: number, encounterId: string): void {
        // In a real game, the player's party would be dynamically determined.
        const playerParty = [{ entityId: characterId.toString(), initialRow: 'Front' as const }];
        this.domainEventBus.emit('startEncounterRequest', {
            team1: playerParty,
            encounterId: encounterId,
        });
    }

    public interactWithNode(characterId: number, nodeId: number): void {
        this.domainEventBus.emit('interactWithNodeRequested', { characterId, nodeId });
    }

    // --- Inventory Commands ---

    public equipItem(characterId: number, itemId: number): void {
        this.domainEventBus.emit('equipItemRequest', { characterId, itemEntityId: itemId });
    }

    public useConsumable(characterId: number, itemId: number): void {
        this.domainEventBus.emit('useConsumableRequest', { characterId, itemEntityId: itemId });
    }

    public sellItem(characterId: number, npcId: number, itemId: number): void {
        this.domainEventBus.emit('sellItemRequested', { characterId, npcId, itemEntityId: itemId });
    }

    // --- Combat Commands ---

    public performSkill(combatEntityId: string, actorId: string, skillId: string, targetId: string): void {
        this.domainEventBus.emit('actionTaken', {
            combatEntityId,
            actorId,
            actionType: 'SKILL',
            skillId,
            targetId,
        });
    }

    public moveRow(combatEntityId: string, actorId: string): void {
        this.domainEventBus.emit('actionTaken', {
            combatEntityId,
            actorId,
            actionType: 'MOVE_ROW',
        });
    }
}

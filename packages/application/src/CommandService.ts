import { EventBus } from 'mmolike_rpg-domain/ecs/EventBus';
import { type VoreRole } from 'mmolike_rpg-domain/ecs/components/character';

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
        console.log(`[CommandService] Firing "actionTaken" for skill: ${skillId}`);
        this.domainEventBus.emit('actionTaken', {
            combatEntityId,
            actorId,
            actionType: 'SKILL',
            skillId,
            targetId,
        });
    }

    public defend(combatEntityId: string, actorId: string): void {
        console.log(`[CommandService] Firing "actionTaken" for defend`);
        this.domainEventBus.emit('actionTaken', {
            combatEntityId,
            actorId,
            actionType: 'SKILL',
            skillId: 'skill_defend', // Use the defend skill
            targetId: actorId, // Target is self
        });
    }

    public createCharacter(options: { name: string; pronouns: string; ancestryId: string }): void {
        this.domainEventBus.emit('characterCreationRequested', options);
    }

    public flee(combatEntityId: string, actorId: string): void {
        console.log(`[CommandService] Firing "fleeAttempt"`);
        this.domainEventBus.emit('fleeAttempt', { combatEntityId, actorId });
    }

    public moveRow(combatEntityId: string, actorId: string): void {
        this.domainEventBus.emit('actionTaken', {
            combatEntityId,
            actorId,
            actionType: 'MOVE_ROW',
        });
    }

    public useItemInBelt(characterId: number, beltIndex: number, combatEntityId?: string): void {
        this.domainEventBus.emit('useItemInBeltRequest', { characterId, beltIndex, combatEntityId });
    }

    // --- Content Filtering & Vore Commands ---

    public updateContentFilter(showNsfwContent: boolean, showVoreContent: boolean): void {
        this.domainEventBus.emit('updateContentFilter', { showNsfwContent, showVoreContent });
    }

    public setPlayerVoreRole(characterId: number, newRole: VoreRole): void {
        this.domainEventBus.emit('setPlayerVoreRole', { characterId, newRole });
    }

    public regurgitate(predatorId: number): void {
        this.domainEventBus.emit('regurgitateRequest', { predatorId });
    }
    // --- NEW DEV COMMAND ---
    public dev_addPreyToStomach(playerId: number, preyData: any): void {
        this.domainEventBus.emit('dev_addPreyToStomach', { playerId, preyData });
    }

    public swapCompanion(characterId: number, companionId: number): void {
        this.domainEventBus.emit('swapCompanionRequested', { characterId, companionId });
    }
}

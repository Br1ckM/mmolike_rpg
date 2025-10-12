export interface ICommandService {
    // Equipment and Inventory
    equipItem(playerId: number, itemId: number): Promise<any>;
    unequipItem(playerId: number, slotId: string): Promise<any>;
    useItemInBelt(playerId: number, slotIndex: number): Promise<any>;
    moveInventoryItem(
        playerId: number,
        source: { bagId: number; slotIndex: number },
        target: { bagId: number; slotIndex: number }
    ): Promise<any>;

    // Player Management
    setPlayerVoreRole(playerId: number, role: string): Promise<any>;

    // Game State
    loadGame(): Promise<any>;
    saveGame(): Promise<any>;
    // Save import/export utilities used by settings UI
    exportSave(): Promise<string | null>;
    importSave(serialized: string): Promise<any>;

    // Character creation
    createCharacter(payload: { name: string; pronouns: string; ancestryId: string }): Promise<any>;

    // Content Filters
    updateContentFilter(showNsfw: boolean, showVore: boolean): Promise<any>;

    // Exploration / Interaction
    exploreInZone(playerId: number, zoneId: string): Promise<any>;
    interactWithNode(playerId: number, nodeId: string): Promise<any>;

    // Combat and Actions
    regurgitate(playerId: number): Promise<any>;
    dev_addPreyToStomach?(playerId: number, prey: any): Promise<any>;
    restAtCamp(playerId: number): Promise<any>;
    initiateDialogue(playerId: number, npcId: string | number): Promise<any>;
    swapCompanion(playerId: number, companionId: string | number): Promise<any>;
    // Dialogue selection (UI -> command)
    selectDialogueResponse(index: number): Promise<any>;
    // Combat-specific actions (required)
    defend(combatEntityId: string, combatantId: string): Promise<any>;
    flee(combatEntityId: string, combatantId: string): Promise<any>;
    performSkill(combatEntityId: string, casterId: string, skillId: string, targetId?: string): Promise<any>;
}

/**
 * Minimal concrete implementation used for wiring/tests.
 * Replace with full implementation later (or register a different implementation in Application).
 */
export class CommandService implements ICommandService {
    // Equipment and Inventory
    async equipItem(playerId: number, itemId: number) {
        // TODO: implement actual logic
        console.log(`[CommandService] equipItem: ${playerId}, ${itemId}`);
        return Promise.resolve(null);
    }

    async unequipItem(playerId: number, slotId: string) {
        console.log(`[CommandService] unequipItem: ${playerId}, ${slotId}`);
        return Promise.resolve(null);
    }

    async useItemInBelt(playerId: number, slotIndex: number, combatEntityId?: string) {
        console.log(`[CommandService] useItemInBelt: ${playerId}, ${slotIndex}, ${combatEntityId}`);
        return Promise.resolve(null);
    }

    async moveInventoryItem(
        playerId: number,
        source: { bagId: number; slotIndex: number },
        target: { bagId: number; slotIndex: number }
    ) {
        console.log(`[CommandService] moveInventoryItem: ${playerId}`, source, target);
        return Promise.resolve(null);
    }

    // Player Management
    async setPlayerVoreRole(playerId: number, role: string) {
        console.log(`[CommandService] setPlayerVoreRole: ${playerId}, ${role}`);
        return Promise.resolve(null);
    }

    // Game State
    async loadGame() {
        console.log(`[CommandService] loadGame`);
        return Promise.resolve(null);
    }

    async saveGame() {
        console.log(`[CommandService] saveGame`);
        return Promise.resolve(null);
    }

    async exportSave() {
        console.log(`[CommandService] exportSave`);
        // Stub: return null (no save present). Real impl should return JSON string.
        return Promise.resolve(null);
    }

    async importSave(serialized: string) {
        console.log(`[CommandService] importSave`);
        // Stub: parse and ignore
        try {
            JSON.parse(serialized);
        } catch (err) {
            console.warn('[CommandService] importSave: invalid payload');
        }
        return Promise.resolve(null);
    }

    async createCharacter(payload: { name: string; pronouns: string; ancestryId: string }) {
        console.log('[CommandService] createCharacter:', payload);
        return Promise.resolve(null);
    }

    // Content Filters
    async updateContentFilter(showNsfw: boolean, showVore: boolean) {
        console.log(`[CommandService] updateContentFilter: showNsfw=${showNsfw}, showVore=${showVore}`);
        return Promise.resolve(null);
    }

    // Combat and Actions
    async regurgitate(playerId: number) {
        console.log(`[CommandService] regurgitate: ${playerId}`);
        return Promise.resolve(null);
    }

    async dev_addPreyToStomach(playerId: number, prey: any) {
        console.log(`[CommandService] dev_addPreyToStomach: ${playerId}`, prey);
        return Promise.resolve(null);
    }

    async exploreInZone(playerId: number, zoneId: string) {
        console.log(`[CommandService] exploreInZone: ${playerId}, ${zoneId}`);
        return Promise.resolve(null);
    }

    async interactWithNode(playerId: number, nodeId: string) {
        console.log(`[CommandService] interactWithNode: ${playerId}, ${nodeId}`);
        return Promise.resolve(null);
    }

    async restAtCamp(playerId: number) {
        console.log(`[CommandService] restAtCamp: ${playerId}`);
        return Promise.resolve(null);
    }

    // Combat-specific actions (stubs)
    async defend(combatEntityId: string, combatantId: string) {
        console.log(`[CommandService] defend: ${combatEntityId}, ${combatantId}`);
        // In a real implementation this would enqueue a 'defend' action for the given combatant
        return Promise.resolve(null);
    }

    async flee(combatEntityId: string, combatantId: string) {
        console.log(`[CommandService] flee: ${combatEntityId}, ${combatantId}`);
        // In a real implementation this would attempt to flee the combat
        return Promise.resolve(null);
    }

    async performSkill(combatEntityId: string, casterId: string, skillId: string, targetId?: string) {
        console.log(`[CommandService] performSkill: ${combatEntityId}, ${casterId}, ${skillId}, ${targetId}`);
        // Real implementation should validate and enqueue the action
        return Promise.resolve(null);
    }

    async initiateDialogue(playerId: number, npcId: string | number) {
        console.log(`[CommandService] initiateDialogue: ${playerId}, ${npcId}`);
        return Promise.resolve(null);
    }

    async swapCompanion(playerId: number, companionId: string | number) {
        console.log(`[CommandService] swapCompanion: ${playerId}, ${companionId}`);
        return Promise.resolve(null);
    }

    // Dialogue selection (UI -> command)
    selectDialogueResponse(index: number): Promise<any>;

    // Dialogue interaction
    async selectDialogueResponse(index: number) {
        console.log(`[CommandService] selectDialogueResponse: ${index}`);
        // Real implementation should forward to dialogue system / GameService
        return Promise.resolve(null);
    }
}
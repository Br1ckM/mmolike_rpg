export interface IPlayerCommandFacade {
    equipItem(playerId: number, itemId: number): Promise<any>;
    unequipItem(playerId: number, slotId: string): Promise<any>;
    useItemInBelt(playerId: number, slotIndex: number): Promise<any>;
    moveInventoryItem(
        playerId: number,
        source: { bagId: number; slotIndex: number },
        target: { bagId: number; slotIndex: number }
    ): Promise<any>;
    setPlayerVoreRole?(playerId: number, role: string): Promise<any>;
}

import type { ICommandService } from '../../../services/CommandService';

/**
 * Thin adapter that exposes a stable, typed surface for player-related commands.
 * Delegates to an underlying ICommandService implementation (the app's CommandService).
 */
export class PlayerCommands implements IPlayerCommandFacade {
    constructor(private commandsImpl: ICommandService) { }

    equipItem(playerId: number, itemId: number) {
        return this.commandsImpl.equipItem(playerId, itemId);
    }

    unequipItem(playerId: number, slotId: string) {
        return this.commandsImpl.unequipItem(playerId, slotId);
    }

    useItemInBelt(playerId: number, slotIndex: number) {
        return this.commandsImpl.useItemInBelt(playerId, slotIndex);
    }

    moveInventoryItem(
        playerId: number,
        source: { bagId: number; slotIndex: number },
        target: { bagId: number; slotIndex: number }
    ) {
        return this.commandsImpl.moveInventoryItem(playerId, source, target);
    }

    setPlayerVoreRole(playerId: number, role: string) {
        // support both modern and legacy method names
        if (typeof (this.commandsImpl as any).setPlayerVoreRole === 'function') {
            return (this.commandsImpl as any).setPlayerVoreRole(playerId, role);
        }
        if (typeof (this.commandsImpl as any).setVoreRole === 'function') {
            return (this.commandsImpl as any).setVoreRole(playerId, role);
        }
        return Promise.resolve(null);
    }

    static fromApplication(app: any) {
        const impl =
            app.commands ??
            app.commandService ??
            (app.getService && app.getService('CommandService'));
        if (!impl) throw new Error('CommandService not available on Application');
        return new PlayerCommands(impl);
    }
}
import { EventEmitter } from 'events';
import { ICommandService, IQueryService } from '../../services';
import type { IGameService } from '../../types';

/**
 * Thin player-domain façade that delegates to lower-level command/query services.
 * Accepts concrete services in ctor so it is easy to unit-test / swap implementations.
 */
export class PlayerService extends EventEmitter {
    constructor(
        private commands: ICommandService,
        private queries: IQueryService,
        private gameService?: IGameService
    ) {
        super();
    }

    // Subscription helper - re-emits events on this instance for domain consumers
    subscribePlayerState(handler: (state: any) => void) {
        // QueryService.subscribe returns an unsubscribe function in the original codebase,
        // mirror that contract here.
        const unsubscribe = this.queries.subscribe<any>('playerState', (s: any) => {
            // re-emit on domain emitter for any local listeners
            this.emit('playerState', s);
            handler(s);
        });
        return unsubscribe;
    }

    // Direct query for player snapshot (if supported by QueryService)
    async getPlayerState(playerId: string | number) {
        // Normalize to string when delegating to gameService which expects string ids
        const asString = typeof playerId === 'number' ? String(playerId) : playerId;
        // Prefer a rich GameService DTO when available
        if (this.gameService && typeof this.gameService.getPlayerState === 'function') {
            return await this.gameService.getPlayerState(asString);
        }
        return this.queries.getPlayerState?.(playerId as any) ?? this.queries.get?.('playerState', playerId as any);
    }

    // Commands - thin delegations to CommandService
    async equipItem(playerId: number, itemId: number) {
        return this.commands.equipItem(playerId, itemId);
    }

    async unequipItem(playerId: number, slotId: string) {
        return this.commands.unequipItem(playerId, slotId);
    }

    async useItemInBelt(playerId: number, slotIndex: number) {
        return this.commands.useItemInBelt(playerId, slotIndex);
    }

    async moveInventoryItem(playerId: number, source: { bagId: number; slotIndex: number }, target: { bagId: number; slotIndex: number }) {
        return this.commands.moveInventoryItem(playerId, source, target);
    }

    async setPlayerVoreRole(playerId: number, role: string) {
        return this.commands.setPlayerVoreRole?.(playerId, role) ?? this.commands.setPlayerVoreRole?.(playerId, role);
    }

    // Convenience factory to build from the centralized Application instance
    static fromApplication(app: any) {
        // app may expose command/query services as `commands` / `queries` or via a service registry.
        const commands = app.commands ?? app.commandService ?? (app.getService && app.getService('CommandService'));
        const queries = app.queries ?? app.queryService ?? (app.getService && app.getService('QueryService'));

        const gameSvc = app.getService && app.getService('GameService');

        if (!commands || !queries) {
            throw new Error('Unable to create PlayerService: application does not expose command/query services');
        }

        return new PlayerService(commands, queries, gameSvc);
    }
}
import { EventEmitter } from '../../utils/EventEmitter';
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
        // If a GameService is available, listen for modifications and fetch the full snapshot
        // so subscribers receive complete PlayerState DTOs instead of minimal change events.
        const gsAny = this.gameService as any;
        if (gsAny && typeof gsAny.subscribe === 'function' && typeof gsAny.getPlayerState === 'function') {
            gsAny.subscribe('playerStateModified', async (payload: any) => {
                try {
                    const id = payload?.characterId ?? payload?.playerId;
                    if (id == null) return;
                    const state = await gsAny.getPlayerState(String(id));
                    if (state) this.emit('playerState', state);
                } catch (err) {
                    // ignore errors from snapshotting; do not crash event loop
                    console.warn('[PlayerService] Failed to fetch player snapshot after modification', err);
                }
            });
        }
    }

    // Subscription helper - consumers subscribe to this PlayerService instance.
    // Returns an unsubscribe function. This bridges QueryService updates into
    // the PlayerService emitter and also listens for GameService events (when available).
    subscribePlayerState(handler: (state: any) => void) {
        // Register the handler on this emitter so callers receive emitted DTOs.
        this.on('playerState', handler as any);

        // Also subscribe to underlying QueryService (if implemented) and re-emit
        // updates coming from it so both sources produce a single unified stream.
        let queriesUnsub: (() => void) | null = null;
        if (this.queries && typeof this.queries.subscribe === 'function') {
            queriesUnsub = this.queries.subscribe<any>('playerState', (s: any) => {
                this.emit('playerState', s);
            });
        }

        // Return an unsubscribe that removes both this handler and the query subscription.
        return () => {
            this.off('playerState', handler as any);
            if (queriesUnsub) queriesUnsub();
        };
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
import { EventEmitter } from 'events';
import type { ICommandService, IQueryService } from '../../services';
import type { IGameService } from '../../types';
import { PlayerService } from './PlayerService';

/**
 * PlayerModule - Handles player character state and progression
 */
export class PlayerModule extends EventEmitter {
    private isStarted = false;
    private playerService?: PlayerService;

    constructor(
        private commands?: ICommandService,
        private queries?: IQueryService,
        private gameService?: IGameService
    ) {
        super();
    }

    async start(): Promise<void> {
        if (this.isStarted) return;

        // Initialize PlayerService if we have the necessary dependencies
        if (this.commands && this.queries) {
            this.playerService = new PlayerService(this.commands, this.queries, this.gameService);
        }

        this.isStarted = true;
        console.log('[PlayerModule] Started');
    }

    async stop(): Promise<void> {
        if (!this.isStarted) return;

        this.isStarted = false;
        console.log('[PlayerModule] Stopped');
    }

    getPlayerState(playerId?: string): any {
        if (this.playerService && playerId) {
            return this.playerService.getPlayerState(playerId);
        }

        // Return basic player state structure
        return {
            id: playerId || 'player_1',
            name: 'Default Player',
            level: 1,
            stats: {
                health: 100,
                mana: 50,
                experience: 0
            },
            inventory: {
                items: [],
                gold: 100
            },
            equipment: {
                weapon: null,
                armor: null,
                accessories: []
            },
            location: 'hub'
        };
    }

    // Delegate to PlayerService methods if available
    async equipItem(playerId: number, itemId: number) {
        if (this.playerService) {
            return this.playerService.equipItem(playerId, itemId);
        }
        return Promise.resolve(null);
    }

    async unequipItem(playerId: number, slotId: string) {
        if (this.playerService) {
            return this.playerService.unequipItem(playerId, slotId);
        }
        return Promise.resolve(null);
    }

    async useItemInBelt(playerId: number, slotIndex: number) {
        if (this.playerService) {
            return this.playerService.useItemInBelt(playerId, slotIndex);
        }
        return Promise.resolve(null);
    }

    subscribePlayerState(handler: (state: any) => void) {
        if (this.playerService) {
            return this.playerService.subscribePlayerState(handler);
        }
        // Return a no-op unsubscribe function
        return () => { };
    }

    // Convenience factory to build from the centralized Application instance
    static fromApplication(app: any) {
        const commands = app.commands ?? app.commandService ?? (app.getService && app.getService('CommandService'));
        const queries = app.queries ?? app.queryService ?? (app.getService && app.getService('QueryService'));
        const gameSvc = app.getService && app.getService('GameService');

        return new PlayerModule(commands, queries, gameSvc);
    }
}
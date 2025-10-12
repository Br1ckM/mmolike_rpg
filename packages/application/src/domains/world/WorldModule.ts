import { EventEmitter } from '../../utils/EventEmitter';
import type { ICommandService, IQueryService } from '../../services';
import type { IGameService } from '../../types';

/**
 * WorldModule - Handles world state, locations, and environment systems
 */
export class WorldModule extends EventEmitter {
    private isStarted = false;

    constructor(
        private commands?: ICommandService,
        private queries?: IQueryService,
        private gameService?: IGameService
    ) {
        super();
    }

    async start(): Promise<void> {
        if (this.isStarted) return;

        this.isStarted = true;
        console.log('[WorldModule] Started');
    }

    async stop(): Promise<void> {
        if (!this.isStarted) return;

        this.isStarted = false;
        console.log('[WorldModule] Stopped');
    }

    getHubState(playerId?: string): any {
        // Return basic hub state structure
        return {
            playerId,
            currentLocation: 'hub',
            availableLocations: ['camp', 'dungeon', 'shop'],
            npcs: [],
            quests: []
        };
    }

    getStaticContent(key: string): any[] {
        // Get content from the content provider injected by the web layer
        const gameApp = (globalThis as any).__gameApp;
        if (gameApp && gameApp._contentProvider) {
            return gameApp._contentProvider.getContent(key);
        }

        console.warn(`[WorldModule] Content key '${key}' requested, but no content provider available.`);
        return [];
    }

    // Convenience factory to build from the centralized Application instance
    static fromApplication(app: any) {
        const commands = app.commands ?? app.commandService ?? (app.getService && app.getService('CommandService'));
        const queries = app.queries ?? app.queryService ?? (app.getService && app.getService('QueryService'));
        const gameSvc = app.getService && app.getService('GameService');

        return new WorldModule(commands, queries, gameSvc);
    }
}
import { EventEmitter } from 'events';
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
        // Return mock static content based on key
        const staticContent: Record<string, any[]> = {
            locations: [
                { id: 'hub', name: 'Hub Area', description: 'Central hub location' },
                { id: 'camp', name: 'Camp', description: 'Rest area for players' },
                { id: 'dungeon', name: 'Dungeon', description: 'Dangerous area with monsters' }
            ],
            zones: [
                { id: 'zone1', name: 'Starting Zone', level: 1 },
                { id: 'zone2', name: 'Forest Zone', level: 5 }
            ],
            npcs: [
                { id: 'merchant', name: 'Merchant', role: 'shop' },
                { id: 'guide', name: 'Guide', role: 'quest' }
            ]
        };

        return staticContent[key] || [];
    }

    // Convenience factory to build from the centralized Application instance
    static fromApplication(app: any) {
        const commands = app.commands ?? app.commandService ?? (app.getService && app.getService('CommandService'));
        const queries = app.queries ?? app.queryService ?? (app.getService && app.getService('QueryService'));
        const gameSvc = app.getService && app.getService('GameService');

        return new WorldModule(commands, queries, gameSvc);
    }
}
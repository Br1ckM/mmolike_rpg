import { EventEmitter } from 'events';
import type { ICommandService, IQueryService } from '../../services';
import type { IGameService } from '../../types';

/**
 * CombatModule - Handles combat mechanics and encounters
 */
export class CombatModule extends EventEmitter {
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
        console.log('[CombatModule] Started');
    }

    async stop(): Promise<void> {
        if (!this.isStarted) return;

        this.isStarted = false;
        console.log('[CombatModule] Stopped');
    }

    getCombatState(combatId?: string): any {
        // Return basic combat state structure
        return {
            combatId: combatId || 'combat_' + Date.now(),
            status: 'inactive',
            participants: [],
            currentTurn: null,
            turnOrder: [],
            effects: []
        };
    }

    generateMobPreview(protoId: string, level: number): any {
        // Generate a mock mob preview
        const baseStats = {
            health: 100 + (level * 10),
            attack: 10 + (level * 2),
            defense: 5 + level,
            speed: 50 + (level * 1)
        };

        return {
            id: protoId,
            name: `Level ${level} ${protoId}`,
            level,
            stats: baseStats,
            abilities: [`${protoId}_attack`, `${protoId}_special`],
            drops: [`${protoId}_loot`]
        };
    }

    // Combat Actions
    async startCombat(playerId: string, enemyIds: string[]): Promise<any> {
        console.log(`[CombatModule] Starting combat for player ${playerId} vs`, enemyIds);
        return {
            combatId: 'combat_' + Date.now(),
            status: 'active',
            participants: [playerId, ...enemyIds]
        };
    }

    async executeAction(combatId: string, playerId: string, action: any): Promise<any> {
        console.log(`[CombatModule] Executing action in ${combatId}:`, action);
        return {
            success: true,
            result: 'Action executed'
        };
    }

    // Convenience factory to build from the centralized Application instance
    static fromApplication(app: any) {
        const commands = app.commands ?? app.commandService ?? (app.getService && app.getService('CommandService'));
        const queries = app.queries ?? app.queryService ?? (app.getService && app.getService('QueryService'));
        const gameSvc = app.getService && app.getService('GameService');

        return new CombatModule(commands, queries, gameSvc);
    }
}
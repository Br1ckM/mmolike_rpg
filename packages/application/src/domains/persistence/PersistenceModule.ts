import { EventEmitter } from '../../utils/EventEmitter';
import type { ICommandService, IQueryService } from '../../services';
import type { IGameService } from '../../types';

/**
 * PersistenceModule - Handles game saves and data persistence
 */
export class PersistenceModule extends EventEmitter {
    private isStarted = false;
    private saveData: Map<string, any> = new Map();

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
        console.log('[PersistenceModule] Started');

        // Initialize with empty save data
        this.initializeDefaultSave();
    }

    async stop(): Promise<void> {
        if (!this.isStarted) return;

        this.isStarted = false;
        console.log('[PersistenceModule] Stopped');
    }

    async save(saveId: string = 'default'): Promise<void> {
        console.log(`[PersistenceModule] Saving game state: ${saveId}`);

        // Collect current game state
        const gameState = {
            timestamp: Date.now(),
            version: '1.0.0',
            playerData: this.collectPlayerData(),
            worldData: this.collectWorldData(),
            metadata: {
                playTime: 0,
                location: 'hub'
            }
        };

        this.saveData.set(saveId, gameState);
        this.emit('gameSaved', { saveId, data: gameState });

        console.log(`[PersistenceModule] Game saved successfully: ${saveId}`);
    }

    async load(saveId: string = 'default'): Promise<any> {
        console.log(`[PersistenceModule] Loading game state: ${saveId}`);

        const saveData = this.saveData.get(saveId);
        if (!saveData) {
            console.log(`[PersistenceModule] No save data found for: ${saveId}`);
            return null;
        }

        this.emit('gameLoaded', { saveId, data: saveData });
        console.log(`[PersistenceModule] Game loaded successfully: ${saveId}`);

        return saveData;
    }

    async listSaves(): Promise<Array<{ id: string; metadata: any }>> {
        const saves = Array.from(this.saveData.entries()).map(([id, data]) => ({
            id,
            metadata: {
                timestamp: data.timestamp,
                version: data.version,
                ...data.metadata
            }
        }));

        return saves;
    }

    async deleteSave(saveId: string): Promise<boolean> {
        const existed = this.saveData.has(saveId);
        this.saveData.delete(saveId);

        if (existed) {
            this.emit('saveDeleted', { saveId });
            console.log(`[PersistenceModule] Save deleted: ${saveId}`);
        }

        return existed;
    }

    private initializeDefaultSave(): void {
        if (!this.saveData.has('default')) {
            const defaultSave = {
                timestamp: Date.now(),
                version: '1.0.0',
                playerData: {},
                worldData: {},
                metadata: {
                    playTime: 0,
                    location: 'hub'
                }
            };
            this.saveData.set('default', defaultSave);
        }
    }

    private collectPlayerData(): any {
        // In a full implementation, this would collect from PlayerService
        return {
            players: [],
            inventory: {},
            equipment: {}
        };
    }

    private collectWorldData(): any {
        // In a full implementation, this would collect from WorldModule
        return {
            locations: {},
            npcs: {},
            quests: {}
        };
    }

    // Convenience factory to build from the centralized Application instance
    static fromApplication(app: any) {
        const commands = app.commands ?? app.commandService ?? (app.getService && app.getService('CommandService'));
        const queries = app.queries ?? app.queryService ?? (app.getService && app.getService('QueryService'));
        const gameSvc = app.getService && app.getService('GameService');

        return new PersistenceModule(commands, queries, gameSvc);
    }
}
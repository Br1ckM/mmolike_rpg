export interface IQueryService {
    subscribe<T = any>(topic: string, handler: (payload: T) => void): () => void;
    getPlayerState?(playerId: number): Promise<any>;
    get?(topic: string, id?: any): Promise<any>;
    /**
     * Return static, read-only content loaded from the content package (e.g. 'ancestries', 'items').
     * Implementations may proxy to a ContentService; default stub returns null.
     */
    getStaticContent(key: string): Promise<any> | any;
}

/**
 * Minimal concrete QueryService implementation for wiring/tests.
 * Replace with a full implementation later (or register another implementation).
 */
export class QueryService implements IQueryService {
    subscribe<T = any>(topic: string, handler: (payload: T) => void): () => void {
        // no-op subscription by default; consumers/tests can replace with mocks or a real impl
        // Return an unsubscribe function
        return () => { };
    }

    async getPlayerState(playerId: number) {
        console.log('[DEBUG - QueryService] ==> getPlayerState called with playerId:', playerId);

        // Try to get real player state from GameService first
        const gameApp = (globalThis as any).__gameApp;
        if (gameApp) {
            const gameService = gameApp.getService('GameService');
            console.log('[DEBUG - QueryService] GameService available:', !!gameService);

            if (gameService && typeof gameService.getPlayerState === 'function') {
                console.log('[DEBUG - QueryService] ==> Calling GameService.getPlayerState');
                try {
                    const realState = await gameService.getPlayerState(String(playerId));
                    console.log('[DEBUG - QueryService] Real player state from GameService:', realState);
                    if (realState) {
                        console.log('[DEBUG - QueryService] ✓ Returning real player state');
                        return realState;
                    }
                } catch (error) {
                    console.error('[DEBUG - QueryService] ❌ Error getting real player state:', error);
                }
            } else {
                console.log('[DEBUG - QueryService] GameService.getPlayerState not available');
            }
        } else {
            console.log('[DEBUG - QueryService] GameApp not available');
        }

        // Fallback to mock data
        console.log('[DEBUG - QueryService] ==> Returning mock player state');
        const mockState = {
            id: playerId || 1,
            name: 'Adventurer',
            health: { current: 100, max: 100 },
            mana: { current: 50, max: 50 },
            coreStats: { strength: 10, dexterity: 10, intelligence: 10 },
            derivedStats: {},
            progression: { level: 1, xp: 0 },
            inventory: {
                wallet: { Gold: 1000 },
                bags: []
            },
            equipment: {},
            skillBook: { knownSkills: [] },
            quests: [],
            AppearanceComponent: null,
            VoreRoleComponent: { role: 'Neither' },
            consumableBelt: { itemIds: [null, null, null, null, null] },
            ancestry: null
        };
        console.log('[DEBUG - QueryService] Mock state:', mockState);
        return Promise.resolve(mockState);
    }

    async get(topic: string, id?: any) {
        return Promise.resolve(null);
    }

    async getStaticContent(key: string) {
        // Try to get content from the content provider injected by the web layer
        const gameApp = (globalThis as any).__gameApp;
        if (gameApp && gameApp._contentProvider) {
            return gameApp._contentProvider.getContent(key);
        }

        console.warn(`[QueryService] Content key '${key}' requested, but no content provider available.`);
        return null;
    }
}
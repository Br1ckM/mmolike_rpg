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
        return Promise.resolve(null);
    }

    async get(topic: string, id?: any) {
        return Promise.resolve(null);
    }

    async getStaticContent(key: string) {
        // Default stub: no content available here. Consumer code should handle null/undefined.
        return Promise.resolve(null);
    }
}
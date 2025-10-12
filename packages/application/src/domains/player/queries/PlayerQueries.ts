import type { IQueryService } from '../../../services/QueryService';

export interface IPlayerQueryFacade {
    subscribe<T = any>(topic: string, handler: (payload: T) => void): () => void;
    getPlayerState?(playerId: number): Promise<any>;
}

/**
 * Adapter that exposes a stable, typed surface for player-related queries/subscriptions.
 * Delegates to the underlying IQueryService implementation.
 */
export class PlayerQueries implements IPlayerQueryFacade {
    constructor(private queriesImpl: IQueryService) { }

    subscribe<T = any>(topic: string, handler: (payload: T) => void) {
        if (typeof this.queriesImpl.subscribe === 'function') {
            return this.queriesImpl.subscribe<T>(topic, handler);
        }

        // support EventEmitter-style implementations on legacy query objects
        const emitter = this.queriesImpl as any;
        if (typeof emitter.on === 'function') {
            emitter.on(topic, handler);
            return () => {
                if (typeof emitter.off === 'function') {
                    emitter.off(topic, handler);
                } else if (typeof emitter.removeListener === 'function') {
                    emitter.removeListener(topic, handler);
                }
            };
        }

        throw new Error('QueryService does not implement a subscribe method');
    }

    getPlayerState(playerId: number) {
        if (typeof this.queriesImpl.getPlayerState === 'function') {
            return this.queriesImpl.getPlayerState(playerId);
        }
        if (typeof this.queriesImpl.get === 'function') {
            return this.queriesImpl.get('playerState', playerId);
        }
        return Promise.resolve(null);
    }

    static fromApplication(app: any) {
        const impl =
            app.queries ??
            app.queryService ??
            (app.getService && app.getService('QueryService'));
        if (!impl) throw new Error('QueryService not available on Application');
        return new PlayerQueries(impl);
    }
}
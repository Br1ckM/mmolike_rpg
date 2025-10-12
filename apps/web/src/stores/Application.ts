// Use the consolidated application package exports instead of relative paths
import type { ICommandService, IQueryService } from 'mmolike_rpg-application';
import { CommandService, QueryService, PlayerService, GameService } from 'mmolike_rpg-application';

export class Application {
    private registry = new Map<string, any>();
    public commands?: ICommandService;
    public queries?: IQueryService;
    public playerService?: PlayerService;

    // readiness promise so consumers (UI, tests) can await initialization
    public readonly isReady: Promise<void>;
    private _readyResolve?: () => void;

    constructor() {
        this.isReady = new Promise<void>((resolve) => {
            this._readyResolve = resolve;
        });
    }

    start(): void {
        // instantiate concrete services (replace with DI/factory if needed)
        const cmd = new CommandService();
        const qry = new QueryService();

        // expose on instance for backwards compatibility
        this.commands = cmd;
        this.queries = qry;

        // register in local registry
        this.registry.set('CommandService', cmd);
        this.registry.set('QueryService', qry);

        // create domain service and register
        const playerSvc = new PlayerService(cmd, qry);
        this.playerService = playerSvc;
        this.registry.set('PlayerService', playerSvc);

        // instantiate and register a lightweight GameService (EventEmitter-based)
        const gameSvc = new GameService();
        this.registry.set('GameService', gameSvc);

        // signal readiness
        this._readyResolve?.();
    }

    getService<T = any>(name: string): T | undefined {
        return this.registry.get(name) as T | undefined;
    }
}

// Convenience singleton for consumers that expect a global App instance
export const App = new Application();
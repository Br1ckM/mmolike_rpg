import type { ICommandService } from '../services/CommandService';
import type { IQueryService } from '../services/QueryService';

// Small runtime helper to attempt requiring an optional module without throwing.
function tryRequire<T = any>(moduleName: string): T | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(moduleName) as T;
    } catch (err) {
        return null;
    }
}
import { CommandService } from '../services/CommandService';
import { QueryService } from '../services/QueryService';
import { PlayerService } from '../domains/player/PlayerService';
import { GameService } from '../services/GameService';

export class Application {
    private registry = new Map<string, any>();
    public commands!: ICommandService;
    public queries!: IQueryService;
    public playerService?: PlayerService;

    // Backwards-compatible alias used by some parts of the UI
    get directQueries(): IQueryService {
        return this.queries;
    }

    // readiness promise so consumers (UI, tests) can await initialization
    public readonly isReady: Promise<void>;
    private _readyResolve?: () => void;

    constructor() {
        this.isReady = new Promise<void>((resolve) => {
            this._readyResolve = resolve;
        });
    }

    registerService<T = any>(name: string, svc: T): void {
        this.registry.set(name, svc);
    }

    // make start async so we can await service initializers (optional)
    async start(): Promise<void> {
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

        // Create and initialize our modular GameService
        const gameSvc = new GameService();
        this.registry.set('GameService', gameSvc);

        // Initialize the GameService
        if (gameSvc.init) {
            await gameSvc.init();
        }

        // Start the GameService
        if (gameSvc.start) {
            await gameSvc.start();
        }

        this._readyResolve?.();
    }

    // helper to expose typed retrieval and allow test injection
    getService<T = any>(name: string): T | undefined {
        return this.registry.get(name) as T | undefined;
    }
}

// Convenience singleton for consumers that expect a global App instance
export const App = new Application();

// Register the App instance globally so modules can access it
(globalThis as any).__gameApp = App;
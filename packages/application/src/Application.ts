import { GameService } from './GameService';
import { CommandService } from './CommandService';
import { QueryService } from './QueryService';
import { GameLoop } from './GameLoop';

/**
 * The main Application class, serving as the single entry point and facade
 * for the Presentation Layer to interact with.
 *
 * It composes all application-level services and exposes them through a clean,
 * unified API.
 */
class Application {
    public game: GameService;
    public commands: CommandService;
    public queries: QueryService;
    private loop: GameLoop;

    constructor() {
        // The root path for your game's content files.
        // This will need to be adjusted based on your final project structure
        // or passed in as an environment variable.
        const contentRootPath = 'packages/content/src';

        // 1. Initialize the core Game Service
        this.game = new GameService(contentRootPath);

        // 2. Initialize the command and query services, passing them the necessary dependencies.
        // The domain's EventBus is the central communication channel.
        this.commands = new CommandService(this.game.eventBus);
        this.queries = new QueryService(this.game, this.game.eventBus);
        this.loop = new GameLoop(this.game);

        // 3. Start the game! This loads content, creates systems, and spawns the player.
        this.game.startGame();
        this.loop.start();
    }
}

// Create a singleton instance of the Application to be imported by the Presentation Layer.
export const App = new Application();

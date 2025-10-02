import { GameService } from './GameService';

/**
 * Manages the main game loop using requestAnimationFrame for smooth,
 * efficient updates.
 */
export class GameLoop {
    private gameService: GameService;
    private isRunning: boolean = false;

    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        requestAnimationFrame(this.tick.bind(this));
        console.log('Game loop started.');
    }

    public stop(): void {
        this.isRunning = false;
        console.log('Game loop stopped.');
    }

    private tick(timestamp: number): void {
        if (!this.isRunning) return;

        // The core update call
        this.gameService.update();

        requestAnimationFrame(this.tick.bind(this));
    }
}

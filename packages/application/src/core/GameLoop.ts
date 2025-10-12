export class GameLoop {
    private running = false;

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }
}

export default GameLoop;

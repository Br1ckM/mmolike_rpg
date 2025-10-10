import { System } from 'ecs-lib';
import { EventBus } from '../EventBus';
import ECS from 'ecs-lib';

/**
 * An abstract base class for all systems in the game that need to interact with the EventBus.
 * It automatically tracks all event subscriptions and provides a single `destroy` method to clean them up.
 */
export abstract class GameSystem extends System {
    protected world: ECS;
    protected eventBus: EventBus;
    private subscriptions: (() => void)[] = [];

    constructor(world: ECS, eventBus: EventBus, components: number[], frequency?: number) {
        super(components, frequency);
        this.world = world;
        this.eventBus = eventBus;
    }

    /**
     * Subscribes to an event on the EventBus and automatically tracks the unsubscribe function.
     * @param key The event to listen for.
     * @param handler The function to call when the event is emitted.
     */
    // --- CORE FIX: Use NonNullable to handle potentially undefined listener arrays ---
    protected subscribe<K extends keyof EventBus['listeners']>(
        key: K,
        handler: (payload: Parameters<NonNullable<EventBus['listeners'][K]>[0]>[0]) => void
    ): void {
        const unsubscribe = this.eventBus.on(key, handler as any);
        this.subscriptions.push(unsubscribe);
    }
    // --- END CORE FIX ---

    /**
     * Unsubscribes all event listeners that were created through this system's `subscribe` method.
     * This is called by the GameService when systems are re-initialized.
     */
    public destroy(): void {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        console.log(`${this.constructor.name} listeners destroyed.`);
    }
}
import { GameService } from './GameService';
import { EventBus } from 'mmolike_rpg-domain/ecs/EventBus';

// Define a generic callback type for subscribers
type Subscriber<T> = (data: T) => void;

/**
 * Subscribes to domain events and provides a reactive way for the
 * Presentation Layer to get updated game state. This is the bridge
 * that will populate Pinia stores.
 */
export class QueryService {
    private gameService: GameService;
    private domainEventBus: EventBus;

    // A simple pub/sub mechanism for different state slices
    private subscribers: { [key: string]: Subscriber<any>[] } = {};

    constructor(gameService: GameService, domainEventBus: EventBus) {
        this.gameService = gameService;
        this.domainEventBus = domainEventBus;

        this.registerDomainEventListeners();
    }

    /**
     * Allows the Presentation Layer (e.g., a Pinia store) to subscribe to state updates.
     * @param key The state slice to subscribe to (e.g., 'playerState').
     * @param callback The function to call with the updated data.
     * @returns An unsubscribe function.
     */
    public subscribe<T>(key: string, callback: Subscriber<T>): () => void {
        if (!this.subscribers[key]) {
            this.subscribers[key] = [];
        }
        this.subscribers[key].push(callback);

        // Immediately provide the current state upon subscription
        if (key === 'playerState') {
            callback(this.gameService.getPlayerState());
        }
        if (key === 'hubState') {
            callback(this.gameService.getHubState());
        }

        // Return an unsubscribe function
        return () => {
            this.subscribers[key] = this.subscribers[key].filter(sub => sub !== callback);
        };
    }

    /**
     * Notifies all subscribers for a given state slice.
     */
    private publish<T>(key: string, data: T): void {
        if (!this.subscribers[key]) {
            return;
        }
        this.subscribers[key].forEach(callback => callback(data));
    }

    /**
     * Central place to listen for all relevant domain events and trigger publishes.
     */
    private registerDomainEventListeners(): void {
        const playerStateEvents: (keyof EventBus['listeners'])[] = [
            'characterEquipmentChanged',
            'questProgressUpdated',
            'inventoryFull', // Example: could trigger a notification
            'skillLearned',
            'damageDealt',
            'healthHealed',
            'playerStateModified'
        ];

        playerStateEvents.forEach(eventName => {
            this.domainEventBus.on(eventName, () => {
                console.log(`[QueryService] Heard '${eventName}'. Refreshing playerState.`)

                const playerState = this.gameService.getPlayerState();
                this.publish('playerState', playerState);
            });
        });

        const combatStateEvents: (keyof EventBus['listeners'])[] = [
            'combatStarted',
            'roundStarted',
            'turnStarted',
            'actionTaken',
            'damageDealt',
            'healthHealed',
            'effectApplied',
            'turnEnded',
        ];

        combatStateEvents.forEach(eventName => {
            this.domainEventBus.on(eventName, () => {
                const combatState = this.gameService.getCombatState();
                this.publish('combatState', combatState);
            });
        });

        this.domainEventBus.on('notification', (payload) => {
            this.publish('notification', payload);
        });

        // Handle events that have specific payloads for the UI
        this.domainEventBus.on('dialogueNodeChanged', (payload) => {
            this.publish('dialogueState', payload);
        });

        this.domainEventBus.on('dialogueEnded', () => {
            this.publish('dialogueState', null); // Signal that dialogue is over
        });

        this.domainEventBus.on('combatEnded', (payload) => {
            this.publish('combatResult', payload);
        });
        this.domainEventBus.on('playerLocationChanged', () => {
            const hubState = this.gameService.getHubState();
            this.publish('hubState', hubState);
        });

        this.domainEventBus.on('vendorInventoryUpdated', (payload) => {
            this.publish('vendorInventoryUpdated', payload);
        });
        this.domainEventBus.on('partyUpdated', (payload) => {
            console.log(`[QueryService] Heard 'partyUpdated'. Publishing to stores.`);
            // We don't need the payload, we just need to tell the stores to refresh.
            // The partyStore will then call getPlayerState() which has the full companion list.
            this.publish('partyUpdated', payload);
        });
    }
}

import ECS from 'ecs-lib';
import { Entity } from 'ecs-lib';
import { EventBus } from '../EventBus';
import { WorldClockComponent, type TimeOfDay } from '../components/world';

/**
 * Manages the in-game time of day. This system is event-driven,
 * advancing time only when specific in-game actions are performed.
 */
export class WorldClockSystem {
    private world: ECS;
    private eventBus: EventBus;
    private worldEntity: Entity; // A direct reference to the single world-state entity
    private timeSequence: TimeOfDay[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

    constructor(world: ECS, eventBus: EventBus, worldEntity: Entity) {
        this.world = world;
        this.eventBus = eventBus;
        this.worldEntity = worldEntity;

        this.eventBus.on('advanceTimeRequested', this.onAdvanceTimeRequested.bind(this));
    }

    private onAdvanceTimeRequested(payload: { increments?: number; to?: TimeOfDay }): void {
        const clockComponent = WorldClockComponent.oneFrom(this.worldEntity);
        if (!clockComponent) {
            console.error("WorldClockSystem: The world entity does not have a WorldClockComponent.");
            return;
        }

        const clock = clockComponent.data;
        let newTime = clock.currentTime;

        if (payload.to) {
            // Advance time until it reaches the specified 'to' time
            while (newTime !== payload.to) {
                const currentIndex = this.timeSequence.indexOf(newTime);
                const nextIndex = (currentIndex + 1) % this.timeSequence.length;
                newTime = this.timeSequence[nextIndex];
            }
        } else {
            // Advance time by a specific number of increments
            const increments = payload.increments ?? 1;
            let currentIndex = this.timeSequence.indexOf(clock.currentTime);
            for (let i = 0; i < increments; i++) {
                currentIndex = (currentIndex + 1) % this.timeSequence.length;
            }
            newTime = this.timeSequence[currentIndex];
        }

        if (clock.currentTime !== newTime) {
            clock.currentTime = newTime;
            console.log(`Time has advanced to: ${newTime}`);
            this.eventBus.emit('timeOfDayChanged', { newTime: newTime });
        }
    }
}
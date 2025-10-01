import ECS from 'ecs-lib';
import { Entity } from 'ecs-lib';
import { EventBus } from '../EventBus';
import { WorldClockComponent, TimeOfDay } from '../components/world';

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

    private onAdvanceTimeRequested(payload: { from: TimeOfDay }): void {
        const clockComponent = WorldClockComponent.oneFrom(this.worldEntity);
        if (!clockComponent) {
            console.error("WorldClockSystem: The provided world entity does not have a WorldClockComponent.");
            return;
        }

        const clock = clockComponent.data;

        // Ensure the request is for the current time to prevent de-sync
        if (clock.currentTime !== payload.from) {
            console.warn(`Time advancement requested from '${payload.from}' but current time is '${clock.currentTime}'. Ignoring.`);
            return;
        }

        // Calculate the next time of day
        const currentIndex = this.timeSequence.indexOf(clock.currentTime);
        const nextIndex = (currentIndex + 1) % this.timeSequence.length;
        const newTime = this.timeSequence[nextIndex];

        // Update the world state
        clock.currentTime = newTime;
        console.log(`Time has advanced to: ${newTime}`);

        // Announce the change to other systems
        this.eventBus.emit('timeOfDayChanged', { newTime: newTime });
    }
}
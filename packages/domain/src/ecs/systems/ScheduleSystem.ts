import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { ScheduleComponent } from '../components/npc';
import { QuestStatusComponent } from '../components/quest';
import { GameSystem } from './GameSystem'; // Import the new base class

// A placeholder for a world state object.
interface WorldState {
    currentTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
    playerEntity: Entity | null;
}

/**
 * Manages the abstract location of NPCs based on their schedules.
 * This system runs on a continuous loop (tick) to check if an NPC's
 * location needs to be updated based on the current time or quest states.
 */
export class ScheduleSystem extends GameSystem { // Extend GameSystem
    private worldState: WorldState;

    constructor(world: ECS, eventBus: EventBus, worldState: WorldState) {
        // This system will automatically operate on all entities
        // that have a ScheduleComponent.
        super(world, eventBus, [ScheduleComponent.type]);

        this.worldState = worldState;
    }

    /**
     * This method is called by the ECS world's update loop for each
     * entity that has a ScheduleComponent.
     */
    update(time: number, delta: number, npc: Entity): void {
        const schedule = ScheduleComponent.oneFrom(npc)!.data;
        let newLocationId: string | null = null;

        // --- Step 1: Check for high-priority quest overrides ---
        const player = this.worldState.playerEntity;
        if (player && schedule.questOverrides) {
            for (const override of schedule.questOverrides) {
                const questStatus = QuestStatusComponent.allFrom(player)
                    .find(q => q.data.questId === override.questId);

                if (questStatus?.data.status === override.questStatus) {
                    newLocationId = override.locationId;
                    break; // First matching override wins
                }
            }
        }

        // --- Step 2: If no override, use the default schedule ---
        if (!newLocationId) {
            const scheduleEntry = schedule.defaultSchedule.find(entry => entry.time === this.worldState.currentTime);
            if (scheduleEntry) {
                newLocationId = scheduleEntry.locationId;
            }
        }

        // --- Step 3: Update the NPC's location and emit an event if it has changed ---
        if (newLocationId && schedule.currentLocationId !== newLocationId) {
            schedule.currentLocationId = newLocationId;
            this.eventBus.emit('npcLocationChanged', {
                npcId: npc.id,
                newLocationId: newLocationId,
            });
            console.log(`NPC ${npc.id} moved to location ${newLocationId}.`);
        }
    }
}
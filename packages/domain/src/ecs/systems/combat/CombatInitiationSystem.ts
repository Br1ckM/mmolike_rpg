import ECS from 'ecs-lib';
import { EventBus } from '../../EventBus';
import { Combat } from '../../entities/combat';
import { CombatantComponent, CombatComponent } from '../../components/combat';
import { DerivedStatsComponent } from '../../components/character';
import { GameSystem } from '../GameSystem'; // Import the new base class

/**
 * Handles the setup and initialization of a new combat encounter.
 */
export class CombatInitiationSystem extends GameSystem { // Extend GameSystem

    constructor(world: ECS, eventBus: EventBus) {
        // This system is event-driven.
        super(world, eventBus, []);

        // Use the inherited 'subscribe' method
        this.subscribe('startCombatEncounter', this.onStartCombatEncounter.bind(this));
    }

    private onStartCombatEncounter(payload: {
        team1: { entityId: string; initialRow: 'Front' | 'Back'; }[];
        team2: { entityId: string; initialRow: 'Front' | 'Back'; }[];
    }): void {
        const allParticipants = [...payload.team1, ...payload.team2];
        const combatantIds: string[] = [];

        // --- Step 1: Add CombatantComponent to all participants ---
        for (const participant of allParticipants) {
            const entity = this.world.getEntity(parseInt(participant.entityId, 10));
            if (!entity) {
                console.error(`CombatInitiation: Could not find entity with ID ${participant.entityId}`);
                continue;
            }

            const stats = DerivedStatsComponent.oneFrom(entity)?.data;
            const initiative = (stats?.speed || 0) + Math.random() * 10; // Simple initiative roll

            const combatantData = {
                teamId: payload.team1.includes(participant) ? 'team1' : 'team2',
                row: participant.initialRow,
                initiative: initiative,
                hasTakenAction: false,
            };

            entity.add(new CombatantComponent(combatantData));
            combatantIds.push(entity.id.toString());
        }

        // --- Step 2: Create the central Combat entity ---
        const combatEntity = new Combat({
            combatants: combatantIds,
            turnQueue: [], // The main CombatSystem will handle sorting this.
            currentTurnIndex: 0,
            roundNumber: 1,
        });

        this.world.addEntity(combatEntity);
        console.log(`Combat initiated with entity ID ${combatEntity.id}.`);

        // --- Step 3: Announce that the combat is ready to begin ---
        this.eventBus.emit('combatStarted', {
            combatEntityId: combatEntity.id.toString(),
            combatants: combatantIds,
        });
    }
}
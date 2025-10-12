import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { DenRunComponent, DenRunData } from '../components/den';
import { CombatComponent } from '../components/combat'
import { DenRun } from '../entities/den'
import { GameSystem } from './GameSystem';

export class DenSystem extends GameSystem {
    private content: any;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        super(world, eventBus, []);
        this.content = loadedContent;

        this.subscribe('denEnterRequested', this.onDenEnterRequested.bind(this));
        this.subscribe('combatEnded', this.onCombatEnded.bind(this));

    }
    private onDenEnterRequested(payload: { characterId: number; denId: string }): void {
        const denData = this.content.dens.get(payload.denId);
        if (!denData) return;

        // Create a new entity to manage this run's state
        const denRunEntity = new DenRun({
            denId: payload.denId,
            denName: denData.name,
            characterId: payload.characterId,
            currentStage: 0,
            totalStages: denData.encounters.length,
            status: 'IN_PROGRESS',
        });
        this.world.addEntity(denRunEntity);

        this.startNextEncounter(denRunEntity);
    }

    private onCombatEnded(payload: { combatEntityId: string; winningTeamId: string }): void {
        const denRunEntity = (this.world as any).entities.find((e: Entity) => DenRunComponent.oneFrom(e));
        // If there's no den run, this system has no work to do.
        if (!denRunEntity) return;

        // --- START OF MODIFIED LOGIC ---
        // Find the combat entity that just ended.
        const combatEntity = (this.world as any).entities.find((e: Entity) => CombatComponent.oneFrom(e));

        const denRun = DenRunComponent.oneFrom(denRunEntity)!.data;

        // Case 1: Player lost the combat or fled. The Den has failed.
        if (payload.winningTeamId !== 'team1') {
            denRun.status = 'FAILED';
            this.eventBus.emit('denRunFailed', { denId: denRun.denId });

            // Clean up both the Den and the Combat entities.
            this.world.removeEntity(denRunEntity);
            if (combatEntity) {
                this.world.removeEntity(combatEntity);
            }
            return;
        }

        // Case 2: Player won the combat. Check if it's the final stage.
        denRun.currentStage++;

        if (denRun.currentStage >= denRun.totalStages) {
            // Den is complete!
            denRun.status = 'COMPLETED';
            this.grantRewards(denRun);
            this.eventBus.emit('denRunCompleted', { denId: denRun.denId });

            // Clean up both the Den and the Combat entities.
            this.world.removeEntity(denRunEntity);
            if (combatEntity) {
                this.world.removeEntity(combatEntity);
            }
        } else {
            // Den is still in progress, start the next encounter.
            // The old combat entity was already removed by CombatSystem, and a new one will be made.
            this.startNextEncounter(denRunEntity);
        }
        // --- END OF MODIFIED LOGIC ---
    }

    private startNextEncounter(denRunEntity: Entity): void {
        const denRun = DenRunComponent.oneFrom(denRunEntity)!.data;
        const denData = this.content.dens.get(denRun.denId);
        const nextEncounterId = denData.encounters[denRun.currentStage];

        this.eventBus.emit('denRunUpdated', { ...denRun });
        this.eventBus.emit('startEncounterRequest', {
            team1: [{ entityId: String(denRun.characterId), initialRow: 'Front' }],
            encounterId: nextEncounterId,
        });
    }

    private grantRewards(denRun: DenRunData): void {
        const denData = this.content.dens.get(denRun.denId);
        if (!denData.rewards) return;

        this.eventBus.emit('experienceGained', {
            characterId: denRun.characterId,
            amount: denData.rewards.experience || 0,
        });

        // This could be expanded to grant gold and items
        console.log(`Granting rewards for completing ${denRun.denId}`);
    }
}
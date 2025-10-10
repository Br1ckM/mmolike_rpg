import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { DenRunComponent, DenRunData } from '../components/den';
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
        if (!denRunEntity) return; // This combat was not part of a den

        const denRun = DenRunComponent.oneFrom(denRunEntity)!.data;

        if (payload.winningTeamId !== 'team1') {
            // Player lost the fight
            denRun.status = 'FAILED';
            this.eventBus.emit('denRunFailed', { denId: denRun.denId });
            this.world.removeEntity(denRunEntity);
            return;
        }

        // Player won, advance to the next stage
        denRun.currentStage++;

        if (denRun.currentStage >= denRun.totalStages) {
            // Gauntlet complete!
            denRun.status = 'COMPLETED';
            this.grantRewards(denRun);
            this.eventBus.emit('denRunCompleted', { denId: denRun.denId });
            this.world.removeEntity(denRunEntity);
        } else {
            // Proceed to the next fight
            this.startNextEncounter(denRunEntity);
        }
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
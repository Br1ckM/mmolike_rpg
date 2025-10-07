import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../../EventBus';
import { CombatantComponent, CombatComponent } from '../../components/combat';
import { DerivedStatsComponent, HealthComponent, ProgressionComponent } from '../../components/character';
import { SkillComponent, type SkillEffectData, type TargetType, type TargetPattern, type SkillCost } from '../../components/skill';
import { type GameConfig } from '../../../ContentService';


/**
 * The core engine for managing the turn-based flow of combat.
 * It handles turn order, action resolution, and win/loss conditions.
 */
export class CombatSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: any;
    private contentIdToEntityIdMap: Map<string, number>;
    private config: GameConfig;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any, contentIdToEntityIdMap: Map<string, number>) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;
        this.config = loadedContent.config;

        this.eventBus.on('combatStarted', this.onCombatStarted.bind(this));
        this.eventBus.on('actionTaken', this.onActionTaken.bind(this));
        this.eventBus.on('fleeAttempt', this.onFleeAttempt.bind(this));
    }

    private onCombatStarted(payload: { combatEntityId: string; combatants: string[]; }): void {
        const combatEntity = this.world.getEntity(parseInt(payload.combatEntityId, 10));
        if (!combatEntity) return;

        const combat = CombatComponent.oneFrom(combatEntity)!.data;

        // Sort combatants by initiative, descending
        combat.turnQueue = payload.combatants.sort((aId, bId) => {
            const a = this.world.getEntity(parseInt(aId, 10));
            const b = this.world.getEntity(parseInt(bId, 10));
            const aInit = CombatantComponent.oneFrom(a!)!.data.initiative;
            const bInit = CombatantComponent.oneFrom(b!)!.data.initiative;
            return bInit - aInit;
        });

        this.startNextTurn(combatEntity);
    }

    private onFleeAttempt(payload: { combatEntityId: string; actorId: string }): void {
        console.log(`[CombatSystem] Heard "fleeAttempt" for actor: ${payload.actorId}`);

        const combatEntity = this.world.getEntity(parseInt(payload.combatEntityId, 10));
        if (!combatEntity) return;

        // For now, flee is always successful. This can be expanded later with logic.
        console.log(`Actor ${payload.actorId} has fled from combat.`);

        // Find the team of the fleeing actor
        const actor = this.world.getEntity(parseInt(payload.actorId, 10));
        const actorCombatant = CombatantComponent.oneFrom(actor!)?.data;

        if (actorCombatant) {
            // If a player flees, it's a loss for their team.
            const winningTeamId = actorCombatant.teamId === 'team1' ? 'team2' : 'team1';
            this.endCombat(combatEntity, winningTeamId);
        }
    }

    private onActionTaken(payload: {
        combatEntityId: string;
        actorId: string;
        actionType: 'SKILL' | 'MOVE_ROW' | 'ITEM';
        skillId?: string;
        targetId?: string;
    }): void {
        console.log(`[CombatSystem] Heard "actionTaken" for action: ${payload.actionType}`);
        const combatEntity = this.world.getEntity(parseInt(payload.combatEntityId, 10));
        if (!combatEntity) return;

        switch (payload.actionType) {
            case 'MOVE_ROW':
                this.resolveMoveRow(payload.actorId);
                break;
            case 'ITEM':
                // The effect was already applied by the ConsumableSystem. We just need to advance the turn.
                console.log(`[CombatSystem] Acknowledging ITEM action for actor ${payload.actorId}.`);
                break;
            case 'SKILL':
                console.log(`[CombatSystem] Resolving SKILL: ${payload.skillId}`);

                const actor = this.world.getEntity(parseInt(payload.actorId, 10))!;
                const numericSkillId = this.contentIdToEntityIdMap.get(payload.skillId!);
                const skillEntity = numericSkillId ? this.world.getEntity(numericSkillId) : undefined;
                if (!actor || !skillEntity) {
                    console.error("Actor or skill not found for action.");
                    break;
                }

                const skillData = SkillComponent.oneFrom(skillEntity)!.data;

                if (!this.canAffordCost(actor, skillData.costs)) {
                    console.log(`Character ${actor.id} cannot afford the cost of skill ${payload.skillId}.`);
                    this.eventBus.emit('turnEnded', { combatEntityId: payload.combatEntityId, endedTurnForId: payload.actorId });
                    this.startNextTurn(combatEntity);
                    return;
                }

                this.payCost(actor, skillData.costs);
                this.resolveSkillUsage(combatEntity, payload.actorId, payload.targetId!, payload.skillId!);
                break;
        }

        console.log("[CombatSystem] Reached end of onActionTaken. Checking for combat end and starting next turn.");

        if (this.checkForCombatEnd(combatEntity)) {
            console.log("[CombatSystem] Combat has ended.");
            return;
        }

        this.eventBus.emit('turnEnded', { combatEntityId: payload.combatEntityId, endedTurnForId: payload.actorId });
        this.startNextTurn(combatEntity);
    }

    private canAffordCost(actor: Entity, costs?: SkillCost[]): boolean {
        if (!costs || costs.length === 0) {
            return true;
        }

        const actorStats = DerivedStatsComponent.oneFrom(actor)?.data;
        const actorHealth = HealthComponent.oneFrom(actor)?.data;

        return costs.every(cost => {
            if (cost.stat === 'health') {
                return actorHealth ? actorHealth.current > cost.amount : false;
            }
            if (actorStats && cost.stat in actorStats) {
                const statKey = cost.stat as keyof typeof actorStats;
                return actorStats[statKey] >= cost.amount;
            }
            return false;
        });
    }

    private payCost(actor: Entity, costs?: SkillCost[]): void {
        if (!costs) return;

        const actorStats = DerivedStatsComponent.oneFrom(actor)?.data;
        const actorHealth = HealthComponent.oneFrom(actor)?.data;

        for (const cost of costs) {
            if (cost.stat === 'health' && actorHealth) {
                actorHealth.current -= cost.amount;
            } else if (actorStats && cost.stat in actorStats) {
                const statKey = cost.stat as keyof typeof actorStats;
                (actorStats[statKey] as number) -= cost.amount;
            }
        }
    }


    private resolveMoveRow(actorId: string): void {
        const actor = this.world.getEntity(parseInt(actorId, 10));
        const combatant = CombatantComponent.oneFrom(actor!)!.data;
        combatant.row = combatant.row === 'Front' ? 'Back' : 'Front';
        console.log(`Entity ${actorId} moved to the ${combatant.row} row.`);
    }

    private resolveSkillUsage(combatEntity: Entity, actorId: string, targetId: string, skillId: string): void {
        console.log(`[CombatSystem] In resolveSkillUsage for skill: ${skillId}`);

        const actor = this.world.getEntity(parseInt(actorId, 10))!;
        const initialTarget = this.world.getEntity(parseInt(targetId, 10))!;

        const skillEntity = this.content.skills.get(skillId);
        if (!skillEntity) {
            console.error(`Skill ${skillId} not found!`);
            // Fallback to a basic attack if skill is not found
            this.resolveDamageEffect(combatEntity, actor, initialTarget, {
                type: 'Damage',
                power: 5,
                scalingStat: 'attack',
                target: 'Enemy',
                targeting: { pattern: 'SINGLE' }
            });
            return;
        }

        const skillData = SkillComponent.oneFrom(skillEntity)!.data;

        for (const effect of skillData.effects) {
            const affectedTargets = this.resolveTargets(initialTarget, effect.targeting.pattern, combatEntity);

            for (const finalTarget of affectedTargets) {
                switch (effect.type) {
                    case 'Damage':
                        this.resolveDamageEffect(combatEntity, actor, finalTarget, effect);
                        break;
                    case 'Heal':
                        this.resolveHealEffect(actor, finalTarget, effect);
                        break;
                    case 'ApplyEffect':
                        this.resolveApplyEffect(actor, finalTarget, effect);
                        break;
                }
            }
        }
    }

    private resolveTargets(initialTarget: Entity, pattern: TargetPattern, combatEntity: Entity): Entity[] {
        const combat = CombatComponent.oneFrom(combatEntity)!.data;
        const initialTargetCombatant = CombatantComponent.oneFrom(initialTarget)!.data;

        const allCombatants = combat.combatants.map(id => this.world.getEntity(parseInt(id, 10))!);

        switch (pattern) {
            case 'SINGLE':
                return [initialTarget];
            case 'FRONT_ROW':
                return allCombatants.filter(e => {
                    const c = CombatantComponent.oneFrom(e)!.data;
                    return c.teamId === initialTargetCombatant.teamId && c.row === 'Front';
                });
            // You can add more cases here for 'ADJACENT', 'ALL_ENEMIES', etc.
            default:
                return [initialTarget];
        }
    }


    private resolveDamageEffect(combatEntity: Entity, actor: Entity, target: Entity, effect: SkillEffectData): void {
        const actorStats = DerivedStatsComponent.oneFrom(actor)!.data;
        const targetStats = DerivedStatsComponent.oneFrom(target)!.data;

        const chanceToHit = Math.max(5, actorStats.accuracy - targetStats.dodge);
        if ((Math.random() * 100) > chanceToHit) {
            console.log(`Attack from ${actor.id} missed ${target.id}!`);
            return;
        }


        const targetHealth = HealthComponent.oneFrom(target)!.data;
        const targetCombatant = CombatantComponent.oneFrom(target)!.data;

        const scalingStatValue = (actorStats as any)[effect.scalingStat as keyof typeof actorStats] || 0;
        let damage = (scalingStatValue * this.config.damage_formula.scaling_stat_multiplier) + (effect.power * this.config.damage_formula.power_multiplier) - targetStats.defense;

        const isCritical = (Math.random() * 100) <= actorStats.critChance;
        if (isCritical) {
            damage *= (actorStats.critDamage / 100);
            console.log("Critical Hit!");
        }


        const isTargetInBackRow = targetCombatant.row === 'Back';
        const targetTeamHasFrontRow = this.doesTeamHaveFrontRow(combatEntity, targetCombatant.teamId, target);

        if (isTargetInBackRow && targetTeamHasFrontRow) {
            damage *= 0.5;
            console.log("Target is in back row, damage reduced.");
        }

        damage = Math.max(1, Math.floor(damage));
        targetHealth.current -= damage;

        this.eventBus.emit('damageDealt', {
            attackerId: actor.id.toString(),
            targetId: target.id.toString(),
            damage: damage,
            isCritical: isCritical
        });
    }

    private resolveHealEffect(actor: Entity, target: Entity, effect: SkillEffectData): void {
        const targetHealth = HealthComponent.oneFrom(target)?.data;
        if (!targetHealth) return;

        const actorStats = DerivedStatsComponent.oneFrom(actor)!.data;
        const scalingStatValue = (actorStats as any)[effect.scalingStat as keyof typeof actorStats] || 0;
        const healAmount = (scalingStatValue * this.config.damage_formula.scaling_stat_multiplier) + (effect.power * this.config.damage_formula.power_multiplier);

        const previousHealth = targetHealth.current;
        targetHealth.current = Math.min(targetHealth.max, targetHealth.current + healAmount);
        const amountHealed = targetHealth.current - previousHealth;

        this.eventBus.emit('healthHealed', {
            healerId: actor.id.toString(),
            targetId: target.id.toString(),
            amount: amountHealed
        });
    }

    private resolveApplyEffect(actor: Entity, target: Entity, effect: SkillEffectData): void {
        console.log(`Applying effect ${effect.effectId} from ${actor.id} to ${target.id}`);
        this.eventBus.emit('effectApplied', {
            sourceId: actor.id.toString(),
            targetId: target.id.toString(),
            effectId: effect.effectId!,
        });
    }

    private startNextTurn(combatEntity: Entity): void {
        console.log("[CombatSystem] Starting next turn...");

        const combat = CombatComponent.oneFrom(combatEntity)!.data;

        // Find the next living combatant
        let nextTurnIndex = combat.currentTurnIndex;
        let nextCombatant: Entity | undefined;

        do {
            nextTurnIndex = (nextTurnIndex + 1) % combat.turnQueue.length;
            if (nextTurnIndex === 0) {
                combat.roundNumber++;
                this.eventBus.emit('roundStarted', { combatEntityId: combatEntity.id.toString(), roundNumber: combat.roundNumber });
            }
            const nextCombatantId = combat.turnQueue[nextTurnIndex];
            nextCombatant = this.world.getEntity(parseInt(nextCombatantId, 10));
        } while (nextCombatant && HealthComponent.oneFrom(nextCombatant)!.data.current <= 0);

        combat.currentTurnIndex = nextTurnIndex;

        this.eventBus.emit('turnStarted', {
            combatEntityId: combatEntity.id.toString(),
            activeCombatantId: nextCombatant!.id.toString()
        });
    }

    private doesTeamHaveFrontRow(combatEntity: Entity, teamId: string, ownEntity: Entity): boolean {
        const combat = CombatComponent.oneFrom(combatEntity)!.data;
        for (const entityId of combat.combatants) {
            if (parseInt(entityId, 10) === ownEntity.id) continue;
            const entity = this.world.getEntity(parseInt(entityId, 10))!;
            const combatant = CombatantComponent.oneFrom(entity)!.data;
            if (combatant.teamId === teamId && combatant.row === 'Front') {
                return true;
            }
        }
        return false;
    }

    private endCombat(combatEntity: Entity, winningTeamId: string): void {
        const combat = CombatComponent.oneFrom(combatEntity)!.data;

        this.eventBus.emit('combatEnded', { combatEntityId: combatEntity.id.toString(), winningTeamId: winningTeamId });

        if (winningTeamId === 'team1') {
            const playerId = combat.combatants.find(id => CombatantComponent.oneFrom(this.world.getEntity(parseInt(id, 10))!)?.data.teamId === 'team1');
            combat.combatants.forEach(id => {
                const combatantEntity = this.world.getEntity(parseInt(id, 10))!;
                if (CombatantComponent.oneFrom(combatantEntity)?.data.teamId === 'team2') {
                    const level = ProgressionComponent.oneFrom(combatEntity)?.data.level ?? 1;
                    this.eventBus.emit('enemyDefeated', { enemyId: id, characterId: parseInt(playerId!, 10), level });
                }
            });
        }

        combat.combatants.forEach(id => {
            const entity = this.world.getEntity(parseInt(id, 10))!;
            const combatantComp = CombatantComponent.oneFrom(entity);
            if (combatantComp) {
                entity.remove(combatantComp);
            }
        });
        this.world.removeEntity(combatEntity);
    }

    private checkForCombatEnd(combatEntity: Entity): boolean {
        const combat = CombatComponent.oneFrom(combatEntity)!.data;
        const team1Alive = combat.combatants.some(id => CombatantComponent.oneFrom(this.world.getEntity(parseInt(id, 10))!)?.data.teamId === 'team1' && HealthComponent.oneFrom(this.world.getEntity(parseInt(id, 10))!)!.data.current > 0);
        const team2Alive = combat.combatants.some(id => CombatantComponent.oneFrom(this.world.getEntity(parseInt(id, 10))!)?.data.teamId === 'team2' && HealthComponent.oneFrom(this.world.getEntity(parseInt(id, 10))!)!.data.current > 0);

        if (!team1Alive || !team2Alive) {
            const winningTeamId = team1Alive ? 'team1' : 'team2';
            this.endCombat(combatEntity, winningTeamId);
            return true;
        }
        return false;
    }
}

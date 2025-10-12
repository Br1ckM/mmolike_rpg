import ECS from 'ecs-lib';
import { Entity } from 'ecs-lib';
import { EventBus } from '../../EventBus';
import { CombatantComponent, CombatComponent } from '../../components/combat';
import { DerivedStatsComponent, HealthComponent, ManaComponent } from '../../components/character';
import { ProgressionComponent } from '../../components/skill';
import { SkillComponent, type SkillCost, type TargetPattern, type SkillEffectData } from '../../components/skill';
import { type GameConfig } from '../../../ContentService';
import { GameSystem } from '../GameSystem'; // Import the new base class
import { MobComponent, LootTableComponent } from '../../components/mob'


/**
 * The core engine for managing the turn-based flow of combat.
 * It handles turn order, action resolution, and win/loss conditions.
 */
export class CombatSystem extends GameSystem { // Extend GameSystem
    private content: any;
    private contentIdToEntityIdMap: Map<string, number>;
    private config: GameConfig;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any, contentIdToEntityIdMap: Map<string, number>) {
        // This system is event-driven.
        super(world, eventBus, []);

        this.content = loadedContent;
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;
        this.config = loadedContent.config;

        // Use the inherited 'subscribe' method
        this.subscribe('combatStarted', this.onCombatStarted.bind(this));
        this.subscribe('actionTaken', this.onActionTaken.bind(this));
        this.subscribe('fleeAttempt', this.onFleeAttempt.bind(this));

    }

    private onCombatStarted(payload: { combatEntityId: string; combatants: string[]; }): void {
        const combatEntity = this.world.getEntity(parseInt(payload.combatEntityId, 10));
        if (!combatEntity) return;

        const combat = CombatComponent.oneFrom(combatEntity)!.data;

        const validCombatantIds = payload.combatants.filter(id => {
            const entity = this.world.getEntity(parseInt(id, 10));
            // Ensure the entity exists and has both a Combatant and Health component.
            return entity && CombatantComponent.oneFrom(entity) && HealthComponent.oneFrom(entity);
        });

        combat.turnQueue = validCombatantIds.sort((aId, bId) => { // <-- Use the filtered list
            const a = this.world.getEntity(parseInt(aId, 10));
            const b = this.world.getEntity(parseInt(bId, 10));
            return CombatantComponent.oneFrom(b!)!.data.initiative - CombatantComponent.oneFrom(a!)!.data.initiative;
        });

        combat.currentTurnIndex = -1;
        combat.roundNumber = 1;

        this.eventBus.emit('roundStarted', { combatEntityId: combatEntity.id.toString(), roundNumber: combat.roundNumber });
        this.startNextTurn(combatEntity);
    }

    private onFleeAttempt(payload: { combatEntityId: string; actorId: string }): void {
        console.log(`[CombatSystem] Heard "fleeAttempt" for actor: ${payload.actorId}`);

        const combatEntity = this.world.getEntity(parseInt(payload.combatEntityId, 10));
        if (!combatEntity) return;

        console.log(`Actor ${payload.actorId} has fled from combat.`);

        const actor = this.world.getEntity(parseInt(payload.actorId, 10));
        const actorCombatant = CombatantComponent.oneFrom(actor!)?.data;

        if (actorCombatant) {
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
                console.log(`[CombatSystem] Acknowledging ITEM action for actor ${payload.actorId}.`);
                break;
            case 'SKILL':
                console.log(`[CombatSystem] Resolving SKILL: ${payload.skillId}`);
                const actor = this.world.getEntity(parseInt(payload.actorId, 10))!;
                const numericSkillId = this.contentIdToEntityIdMap.get(payload.skillId!);
                const skillEntity = numericSkillId ? this.world.getEntity(numericSkillId) : undefined;

                if (!actor || !skillEntity) {
                    console.error("Actor or skill not found for action. Ending turn.");
                    break;
                }

                const skillData = SkillComponent.oneFrom(skillEntity)?.data;
                if (!skillData) {
                    console.error(`[CombatSystem] FATAL: Could not retrieve SkillComponent data for skill entity ${skillEntity.id}. Falling back to basic attack.`);
                    this.resolveDamageEffect(combatEntity, actor, this.world.getEntity(parseInt(payload.targetId!, 10))!, {
                        type: 'Damage', power: 5, scalingStat: 'attack', target: 'Enemy', targeting: { pattern: 'SINGLE' }
                    } as any);
                    break;
                }

                if (!this.canAffordCost(actor, skillData.costs)) {
                    console.log(`Character ${actor.id} cannot afford skill ${payload.skillId}. Ending turn.`);
                    break;
                }

                this.payCost(actor, skillData.costs);
                this.resolveSkillUsage(combatEntity, payload.actorId, payload.targetId!, payload.skillId!);
                break;
        }

        if (this.checkForCombatEnd(combatEntity)) {
            console.log("[CombatSystem] Combat has ended after action resolution.");
            return;
        }

        this.eventBus.emit('turnEnded', { combatEntityId: payload.combatEntityId, endedTurnForId: payload.actorId });
        this.startNextTurn(combatEntity);
    }

    private canAffordCost(actor: Entity, costs?: SkillCost[]): boolean {
        if (!costs || costs.length === 0) {
            return true;
        }

        const actorHealth = HealthComponent.oneFrom(actor)?.data;
        const actorMana = ManaComponent.oneFrom(actor)?.data;
        const actorStats = DerivedStatsComponent.oneFrom(actor)?.data;

        for (const cost of costs) {
            if (cost.stat === 'health') {
                if (!actorHealth || actorHealth.current <= cost.amount) {
                    return false;
                }
            } else if (cost.stat === 'mana') {
                if (!actorMana || actorMana.current < cost.amount) {
                    return false;
                }
            } else if (actorStats && cost.stat in actorStats) {
                const statKey = cost.stat as keyof typeof actorStats;
                if ((actorStats[statKey] as number) < cost.amount) {
                    return false;
                }
            } else {
                return false;
            }
        }

        return true;
    }

    private payCost(actor: Entity, costs?: SkillCost[]): void {
        if (!costs) return;

        const actorHealth = HealthComponent.oneFrom(actor)?.data;
        const actorMana = ManaComponent.oneFrom(actor)?.data;

        for (const cost of costs) {
            if (cost.stat === 'health' && actorHealth) {
                actorHealth.current -= cost.amount;
                actorHealth.current = Math.max(0, actorHealth.current); // Clamp HP
            } else if (cost.stat === 'mana' && actorMana) {
                actorMana.current -= cost.amount;
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
        let skillEntity: Entity | undefined;
        let skillData: any | undefined;

        const numericSkillId = this.contentIdToEntityIdMap.get(skillId);
        if (numericSkillId) {
            skillEntity = this.world.getEntity(numericSkillId);
            if (skillEntity) {
                skillData = SkillComponent.oneFrom(skillEntity)?.data;
            }
        }

        if (!skillData) {
            const raw = this.content.skills.get(skillId);
            if (raw) {
                const maybeData = SkillComponent.oneFrom(raw as any)?.data;
                if (maybeData) {
                    skillEntity = raw as any;
                    skillData = maybeData;
                } else if ((raw as any).components && (raw as any).components.skill) {
                    skillData = (raw as any).components.skill;
                }
            }
        }

        if (!skillData) {
            console.error(`Skill ${skillId} not found or missing SkillComponent data! Falling back to basic attack.`);
            this.resolveDamageEffect(combatEntity, actor, initialTarget, {
                type: 'DAMAGE',
                power: 5,
                scalingStat: 'attack',
                target: 'Enemy',
                targeting: { pattern: 'SINGLE' }
            });
            return;
        }

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
        targetHealth.current = Math.max(0, targetHealth.current); // Clamp HP

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
        targetHealth.current = Math.min(targetHealth.max, targetHealth.current + Math.floor(healAmount));
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
        const combat = CombatComponent.oneFrom(combatEntity)!.data;

        for (let i = 0; i < combat.turnQueue.length; i++) {
            const potentialIndex = (combat.currentTurnIndex + 1 + i) % combat.turnQueue.length;

            const potentialCombatantId = combat.turnQueue[potentialIndex];
            const potentialCombatant = this.world.getEntity(parseInt(potentialCombatantId, 10));

            if (potentialCombatant && HealthComponent.oneFrom(potentialCombatant)!.data.current > 0) {
                if (potentialIndex <= combat.currentTurnIndex) {
                    combat.roundNumber++;
                    this.eventBus.emit('roundStarted', { combatEntityId: combatEntity.id.toString(), roundNumber: combat.roundNumber });
                }

                combat.currentTurnIndex = potentialIndex;
                this.eventBus.emit('turnStarted', {
                    combatEntityId: combatEntity.id.toString(),
                    activeCombatantId: potentialCombatantId
                });
                return;
            }
        }
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
        const losingTeamId = winningTeamId === 'team1' ? 'team2' : 'team1';

        // --- MODIFIED SECTION: Now creates a richer payload ---
        const defeatedPayloads: {
            protoId: string;
            characterId: number;
            level: number;
            lootTableIds: string[];
        }[] = [];
        // --- END MODIFICATION ---

        const playerId = combat.combatants.find(id =>
            CombatantComponent.oneFrom(this.world.getEntity(parseInt(id, 10))!)?.data.teamId === 'team1'
        );
        const entitiesToRemove: Entity[] = [];

        for (const id of combat.combatants) {
            const ent = this.world.getEntity(parseInt(id, 10));
            if (!ent) continue;
            const c = CombatantComponent.oneFrom(ent)?.data;

            if (c?.teamId === losingTeamId) {
                const level = ProgressionComponent.oneFrom(ent)?.data.level ?? 1;
                // --- MODIFIED SECTION: Extract data before entity is queued for removal ---
                const mobComp = MobComponent.oneFrom(ent)?.data;
                const lootComp = LootTableComponent.oneFrom(ent)?.data;

                if (losingTeamId === 'team2' && mobComp) {
                    defeatedPayloads.push({
                        protoId: mobComp.protoId,
                        characterId: parseInt(playerId ?? '0', 10),
                        level,
                        lootTableIds: lootComp?.tableIds || [],
                    });
                }
                // --- END MODIFICATION ---
                entitiesToRemove.push(ent);
            }
        }

        // ... cleanup logic remains the same ...
        combat.combatants.forEach(id => {
            const entity = this.world.getEntity(parseInt(id, 10));
            if (!entity) return;
            const combatantComp = CombatantComponent.oneFrom(entity);
            if (combatantComp) {
                entity.remove(combatantComp);
            }
        });
        this.world.removeEntity(combatEntity);
        entitiesToRemove.forEach(entity => {
            console.log(`[CombatSystem] Removing defeated entity ${entity.id} from the world.`);
            this.world.removeEntity(entity);
        });

        this.eventBus.emit('combatEnded', { combatEntityId: combatEntity.id.toString(), winningTeamId });

        // Emit the richer payloads
        for (const p of defeatedPayloads) {
            this.eventBus.emit('enemyDefeated', p);
        }
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
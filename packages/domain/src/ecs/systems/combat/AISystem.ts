import ECS from 'ecs-lib';
import { Entity } from 'ecs-lib';
import { EventBus } from '../../EventBus';
import { CombatantComponent, CombatComponent, AIProfileComponent, type AIBehaviorProfile } from '../../components/combat';
import { HealthComponent, SkillBookComponent } from '../../components/character';
import { SkillComponent, type SkillEffectData } from '../../components/skill';

/**
 * Manages decision-making for all AI-controlled entities in combat.
 */
export class AISystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: any; // To access skill definitions

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;

        this.eventBus.on('turnStarted', this.onTurnStarted.bind(this));
    }

    private onTurnStarted(payload: { combatEntityId: string; activeCombatantId: string; }): void {
        const activeCombatant = this.world.getEntity(parseInt(payload.activeCombatantId, 10));
        if (!activeCombatant) return;

        const aiProfile = AIProfileComponent.oneFrom(activeCombatant)?.data;
        if (!aiProfile) {
            return; // Not an AI-controlled entity
        }

        const decision = this.makeDecision(activeCombatant, aiProfile.profile, payload.combatEntityId);

        if (decision) {
            this.eventBus.emit('actionTaken', {
                combatEntityId: payload.combatEntityId,
                actorId: payload.activeCombatantId,
                actionType: 'SKILL',
                ...decision
            });
        } else {
            // If no action can be taken, end the turn
            this.eventBus.emit('turnEnded', { combatEntityId: payload.combatEntityId, endedTurnForId: payload.activeCombatantId });
        }
    }

    private makeDecision(actor: Entity, profile: AIBehaviorProfile, combatEntityId: string): { targetId: string, skillId: string } | null {
        switch (profile) {
            case 'Aggressor':
                return this.getAggressorAction(actor, combatEntityId);
            case 'Healer':
                return this.getHealerAction(actor, combatEntityId);
            default:
                return this.getAggressorAction(actor, combatEntityId);
        }
    }

    private getAggressorAction(actor: Entity, combatEntityId: string): { targetId: string, skillId: string } | null {
        const combatEntity = this.world.getEntity(parseInt(combatEntityId, 10));
        if (!combatEntity) return null;

        const combat = CombatComponent.oneFrom(combatEntity)!.data;
        const actorCombatant = CombatantComponent.oneFrom(actor)!.data;
        const knownSkills = SkillBookComponent.oneFrom(actor)?.data.knownSkills || ['basic_attack'];

        // Find potential targets (alive enemies)
        const potentialTargets = combat.combatants
            .map(id => this.world.getEntity(parseInt(id, 10))!)
            .filter(entity => {
                const combatant = CombatantComponent.oneFrom(entity)!.data;
                const health = HealthComponent.oneFrom(entity)!.data;
                return combatant.teamId !== actorCombatant.teamId && health.current > 0;
            });

        if (potentialTargets.length === 0) return null;

        // Simple Tactic: Find the highest power single-target damage skill and use it on the lowest health enemy.
        let bestSkillId = 'basic_attack';
        let maxPower = 0;

        for (const skillId of knownSkills) {
            const skillEntity = this.content.skills.get(skillId);
            const skillData = SkillComponent.oneFrom(skillEntity)?.data;
            const damageEffect = skillData?.effects.find(e => e.type === 'Damage');
            if (damageEffect && damageEffect.power > maxPower) {
                maxPower = damageEffect.power;
                bestSkillId = skillId;
            }
        }

        const target = potentialTargets.sort((a, b) => HealthComponent.oneFrom(a)!.data.current - HealthComponent.oneFrom(b)!.data.current)[0];

        return {
            targetId: target.id.toString(),
            skillId: bestSkillId
        };
    }

    private getHealerAction(actor: Entity, combatEntityId: string): { targetId: string, skillId: string } | null {
        const combatEntity = this.world.getEntity(parseInt(combatEntityId, 10));
        if (!combatEntity) return null;

        const combat = CombatComponent.oneFrom(combatEntity)!.data;
        const actorCombatant = CombatantComponent.oneFrom(actor)!.data;
        const knownSkills = SkillBookComponent.oneFrom(actor)?.data.knownSkills || [];

        // --- Healer Tactic ---
        // 1. Find the best healing skill.
        const healSkill = knownSkills.map(id => this.content.skills.get(id)).find(skillEntity =>
            SkillComponent.oneFrom(skillEntity)?.data.effects.some(e => e.type === 'Heal')
        );

        // 2. Find an ally (including self) who is injured.
        if (healSkill) {
            const potentialAllies = combat.combatants
                .map(id => this.world.getEntity(parseInt(id, 10))!)
                .filter(entity => CombatantComponent.oneFrom(entity)!.data.teamId === actorCombatant.teamId)
                .map(entity => ({ entity, health: HealthComponent.oneFrom(entity)!.data }))
                .filter(({ health }) => health.current < health.max) // Find injured allies
                .sort((a, b) => (a.health.current / a.health.max) - (b.health.current / b.health.max)); // Sort by lowest % health

            if (potentialAllies.length > 0) {
                // Heal the most injured ally
                return {
                    skillId: healSkill.id.toString(),
                    targetId: potentialAllies[0].entity.id.toString()
                };
            }
        }

        // 3. If no one needs healing, perform a basic attack (fallback to Aggressor logic).
        return this.getAggressorAction(actor, combatEntityId);
    }
}
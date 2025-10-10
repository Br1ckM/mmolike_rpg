import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { ActiveTraitsComponent } from '../components/mob';
import type { TraitEffect, TraitTrigger } from '../components/traits';
import { HealthComponent } from '../components/character';
import { TraitDefinitionComponent } from '../components/traits';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Manages the effects of passive traits during combat.
 * This system is highly data-driven, reacting to events based on
 * the trigger and effect definitions in the loaded TraitData.
 */
export class TraitSystem extends GameSystem { // Extend GameSystem
    private content: {
        traits: Map<string, Entity>;
    };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.content = loadedContent;

        // Use the inherited 'subscribe' method
        this.subscribe('turnStarted', this.onTurnStarted.bind(this));
        this.subscribe('damageDealt', this.onDamageDealt.bind(this));
    }

    // --- EVENT HANDLERS ---

    private onTurnStarted(payload: { activeCombatantId: string }): void {
        const entity = this.world.getEntity(parseInt(payload.activeCombatantId, 10));
        if (!entity) return;

        this.processTraits(entity, 'ON_TURN_START', { self: entity });
    }

    private onDamageDealt(payload: { attackerId: string, targetId: string, damage: number }): void {
        const attacker = this.world.getEntity(parseInt(payload.attackerId, 10));
        const target = this.world.getEntity(parseInt(payload.targetId, 10));
        if (!attacker || !target) return;

        this.processTraits(attacker, 'ON_DAMAGE_DEALT', { self: attacker, target: target });
        this.processTraits(target, 'ON_DAMAGE_TAKEN', { self: target, attacker: attacker, damage: payload.damage });
    }

    // --- CORE LOGIC ---

    private processTraits(entity: Entity, trigger: TraitTrigger, context: any): void {
        const activeTraits = ActiveTraitsComponent.oneFrom(entity)?.data.traitIds;
        if (!activeTraits) return;

        for (const traitId of activeTraits) {
            const traitEntity = this.content.traits.get(traitId);
            if (!traitEntity) continue;

            const traitData = TraitDefinitionComponent.oneFrom(traitEntity)?.data;

            if (traitData && traitData.trigger === trigger) {
                for (const effect of traitData.effects) {
                    this.resolveEffect(effect, context);
                }
            }
        }
    }

    private resolveEffect(effect: TraitEffect, context: any): void {
        if (effect.chance && Math.random() > effect.chance) {
            return;
        }

        let finalTarget: Entity | undefined;
        switch (effect.target) {
            case 'SELF': finalTarget = context.self; break;
            case 'ATTACKER': finalTarget = context.attacker; break;
            case 'TARGET': finalTarget = context.target; break;
        }
        if (!finalTarget) return;

        switch (effect.type) {
            case 'APPLY_EFFECT':
                if (effect.effectId) {
                    this.eventBus.emit('effectApplied', {
                        sourceId: context.self.id.toString(),
                        targetId: finalTarget.id.toString(),
                        effectId: effect.effectId,
                    });
                }
                break;
            case 'HEAL':
                const health = HealthComponent.oneFrom(finalTarget)?.data;
                if (health && effect.value) {
                    health.current = Math.min(health.max, health.current + effect.value);
                }
                break;
            case 'REFLECT_DAMAGE':
                const attackerHealth = HealthComponent.oneFrom(finalTarget)?.data;
                const reflectedDamage = Math.round(context.damage * (effect.value || 0));
                if (attackerHealth && reflectedDamage > 0) {
                    this.eventBus.emit('damageDealt', {
                        attackerId: context.self.id.toString(),
                        targetId: finalTarget.id.toString(),
                        damage: reflectedDamage,
                        isCritical: false,
                    });
                }
                break;
        }
    }
}
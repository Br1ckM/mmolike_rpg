import ECS, { Entity } from 'ecs-lib';
import { EventBus } from '../EventBus';
import { ActiveTraitsComponent } from '../components/mob';
import type { TraitData, TraitEffect, TraitTarget, TraitTrigger } from '../components/traits';
import { DerivedStatsComponent, HealthComponent } from '../components/character';

/**
 * Manages the effects of passive traits during combat.
 * This system is highly data-driven, reacting to events based on
 * the trigger and effect definitions in the loaded TraitData.
 */
export class TraitSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: {
        traits: Map<string, TraitData>;
    };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;

        // Subscribe to all relevant combat events
        this.eventBus.on('turnStarted', this.onTurnStarted.bind(this));
        this.eventBus.on('damageDealt', this.onDamageDealt.bind(this));
        // You would add more listeners here, e.g., eventBus.on('actionTaken', ...)
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

        // Process traits for the attacker
        this.processTraits(attacker, 'ON_DAMAGE_DEALT', { self: attacker, target: target });

        // Process traits for the target
        this.processTraits(target, 'ON_DAMAGE_TAKEN', { self: target, attacker: attacker, damage: payload.damage });
    }

    // --- CORE LOGIC ---

    /**
     * Finds and executes all traits on an entity that match a given trigger.
     * @param entity The entity to check for traits.
     * @param trigger The TraitTrigger to match (e.g., 'ON_DAMAGE_TAKEN').
     * @param context An object containing relevant entities and data for the event.
     */
    private processTraits(entity: Entity, trigger: TraitTrigger, context: any): void {
        const activeTraits = ActiveTraitsComponent.oneFrom(entity)?.data.traitIds;
        if (!activeTraits) return;

        for (const traitId of activeTraits) {
            const traitData = this.content.traits.get(traitId);
            if (traitData && traitData.trigger === trigger) {
                for (const effect of traitData.effects) {
                    this.resolveEffect(effect, context);
                }
            }
        }
    }

    /**
     * Executes a single trait effect based on its type and context.
     * This is the heart of the extensible system.
     * @param effect The TraitEffect data to execute.
     * @param context An object containing relevant entities (self, attacker, target) and data.
     */
    private resolveEffect(effect: TraitEffect, context: any): void {
        // Handle optional chance
        if (effect.chance && Math.random() > effect.chance) {
            return;
        }

        // Determine the final target of the effect
        let finalTarget: Entity | undefined;
        switch (effect.target) {
            case 'SELF': finalTarget = context.self; break;
            case 'ATTACKER': finalTarget = context.attacker; break;
            case 'TARGET': finalTarget = context.target; break;
        }
        if (!finalTarget) return;

        // Execute the effect logic
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
                        attackerId: context.self.id.toString(), // The damage source is the one with the trait
                        targetId: finalTarget.id.toString(), // The target is the original attacker
                        damage: reflectedDamage,
                        isCritical: false,
                    });
                }
                break;

            // 'MODIFY_STAT' is a more complex case that would typically be handled
            // by the StatCalculationSystem, which would check for traits.
            // For simplicity in this system, we'll omit its direct implementation here.
        }
    }
}
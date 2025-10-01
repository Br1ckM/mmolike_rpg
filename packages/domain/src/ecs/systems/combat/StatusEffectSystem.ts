import ECS from 'ecs-lib';
import { EventBus } from '../../EventBus';
import { ActiveEffectComponent } from '../../components/combat';
import { HealthComponent } from '../../components/character';
import { EffectDefinitionComponent } from '../../components/effects';

/**
 * Manages the lifecycle of status effects on entities in combat.
 */
export class StatusEffectSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: any; // To access effect definitions

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;

        this.eventBus.on('effectApplied', this.onEffectApplied.bind(this));
        this.eventBus.on('turnStarted', this.onTurnStarted.bind(this));
    }

    private onEffectApplied(payload: { sourceId: string; targetId: string; effectId: string; }): void {
        const target = this.world.getEntity(parseInt(payload.targetId, 10));
        const effectDefinitionEntity = this.content.effects.get(payload.effectId);

        if (!target || !effectDefinitionEntity) return;

        const effectDef = EffectDefinitionComponent.oneFrom(effectDefinitionEntity)!.data;

        // Get or create the array of active effects on the target
        let activeEffects = ActiveEffectComponent.oneFrom(target);
        if (!activeEffects) {
            activeEffects = new ActiveEffectComponent([]);
            target.add(activeEffects);
        }

        // Add the new effect to the array
        activeEffects.data.push({
            effectId: payload.effectId,
            name: effectDef.name,
            sourceId: payload.sourceId,
            durationInTurns: effectDef.baseDuration,
        });

        console.log(`Applied effect '${effectDef.name}' to entity ${target.id}.`);
    }

    private onTurnStarted(payload: { combatEntityId: string; activeCombatantId: string; }): void {
        const activeCombatant = this.world.getEntity(parseInt(payload.activeCombatantId, 10));
        if (!activeCombatant) return;

        const activeEffectsComponent = ActiveEffectComponent.oneFrom(activeCombatant);
        if (!activeEffectsComponent || activeEffectsComponent.data.length === 0) return;

        const effects = activeEffectsComponent.data;

        // Process effects in reverse order so we can safely remove them
        for (let i = effects.length - 1; i >= 0; i--) {
            const effectInstance = effects[i];
            const effectDefEntity = this.content.effects.get(effectInstance.effectId);
            const effectDef = EffectDefinitionComponent.oneFrom(effectDefEntity!)!.data;

            // --- Handle Tick Effects (DOTs/HOTs) ---
            if (effectDef.tickEffect) {
                if (effectDef.tickEffect.type === 'DAMAGE') {
                    const health = HealthComponent.oneFrom(activeCombatant)!.data;
                    const damage = effectDef.tickEffect.power;
                    health.current -= damage;
                    this.eventBus.emit('damageDealt', {
                        attackerId: effectInstance.sourceId,
                        targetId: activeCombatant.id.toString(),
                        damage: damage,
                        isCritical: false
                    });
                    console.log(`'${effectDef.name}' dealt ${damage} damage to ${activeCombatant.id}.`);
                }
                // Add logic for 'HEAL' here if needed
            }

            // --- Decrement Duration ---
            effectInstance.durationInTurns--;

            if (effectInstance.durationInTurns <= 0) {
                console.log(`Effect '${effectDef.name}' has expired on ${activeCombatant.id}.`);
                effects.splice(i, 1); // Remove the effect from the array
            }
        }
    }
}
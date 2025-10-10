import ECS from 'ecs-lib';
import { EventBus } from '../../EventBus';
import { ActiveEffectComponent } from '../../components/combat';
import { HealthComponent } from '../../components/character';
import { EffectDefinitionComponent } from '../../components/effects';
import { GameSystem } from '../GameSystem'; // Import the new base class

/**
 * Manages the lifecycle of status effects on entities in combat.
 */
export class StatusEffectSystem extends GameSystem { // Extend GameSystem
    private content: any; // To access effect definitions

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.content = loadedContent;

        // Use the inherited 'subscribe' method
        this.subscribe('effectApplied', this.onEffectApplied.bind(this));
        this.subscribe('turnStarted', this.onTurnStarted.bind(this));
    }

    private onEffectApplied(payload: { sourceId: string; targetId: string; effectId: string; }): void {
        const target = this.world.getEntity(parseInt(payload.targetId, 10));
        const effectDefinitionEntity = this.content.effects.get(payload.effectId);

        if (!target || !effectDefinitionEntity) return;

        const effectDef = EffectDefinitionComponent.oneFrom(effectDefinitionEntity)!.data;

        let activeEffects = ActiveEffectComponent.oneFrom(target);
        if (!activeEffects) {
            activeEffects = new ActiveEffectComponent([]);
            target.add(activeEffects);
        }

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

        for (let i = effects.length - 1; i >= 0; i--) {
            const effectInstance = effects[i];
            const effectDefEntity = this.content.effects.get(effectInstance.effectId);
            const effectDef = EffectDefinitionComponent.oneFrom(effectDefEntity!)!.data;

            if (effectDef.tickEffect) {
                if (effectDef.tickEffect.type === 'DAMAGE') {
                    const health = HealthComponent.oneFrom(activeCombatant)!.data;
                    const damage = effectDef.tickEffect.power;
                    health.current -= damage;
                    health.current = Math.max(0, health.current); // Clamp HP
                    this.eventBus.emit('damageDealt', {
                        attackerId: effectInstance.sourceId,
                        targetId: activeCombatant.id.toString(),
                        damage: damage,
                        isCritical: false
                    });
                    console.log(`'${effectDef.name}' dealt ${damage} damage to ${activeCombatant.id}.`);
                }
            }

            effectInstance.durationInTurns--;

            if (effectInstance.durationInTurns <= 0) {
                console.log(`Effect '${effectDef.name}' has expired on ${activeCombatant.id}.`);
                effects.splice(i, 1);
            }
        }
    }
}
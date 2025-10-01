import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import {
    CoreStatsComponent,
    DerivedStatsComponent,
    EquipmentComponent,
    HealthComponent,
} from '../components/character';
import { EquipableComponent } from '../components/item';
import { ActiveEffectComponent } from '../components/combat';
import { EffectDefinitionComponent } from '../components/effects';
import { MobArchetypeData, ActiveTraitsComponent } from '../components/mob';
import { TraitData } from '../components/traits';

/**
 * The single source of truth for all character stat calculations.
 */
export class StatCalculationSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: {
        effects: Map<string, any>;
        traits: Map<string, TraitData>;
    };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;

        eventBus.on('characterEquipmentChanged', this.onCharacterChange.bind(this));
        eventBus.on('effectApplied', this.onCharacterChange.bind(this));
    }

    private onCharacterChange(payload: { characterId?: number; targetId?: string }): void {
        const id = payload.characterId ?? (payload.targetId ? parseInt(payload.targetId, 10) : undefined);
        if (id === undefined) return;

        const character = this.world.getEntity(id);
        if (character) {
            this.update(character);
        }
    }

    public update(entity: Entity, archetypes?: MobArchetypeData[]): void {
        const coreStats = CoreStatsComponent.oneFrom(entity)?.data;
        if (!coreStats) return;

        const finalStats = {
            health: coreStats.strength * 10,
            mana: coreStats.intelligence * 5,
            attack: coreStats.strength * 2,
            magicAttack: coreStats.intelligence * 2,
            defense: coreStats.dexterity * 1.5,
            magicResist: coreStats.intelligence * 1.5,
            critChance: 5,
            critDamage: 150,
            dodge: coreStats.dexterity * 0.5,
            haste: 0,
            accuracy: 80,
        };

        if (archetypes) {
            for (const arch of archetypes) {
                if (arch.modifiers) {
                    for (const [stat, value] of Object.entries(arch.modifiers)) {
                        const [statName, modType] = stat.split('_');

                        // --- FIX IS HERE ---
                        // We cast statName to keyof typeof finalStats to assure TypeScript it's a valid key.
                        const key = statName as keyof typeof finalStats;

                        if (modType === 'percent') {
                            finalStats[key] *= value;
                        } else if (modType === 'flat') {
                            finalStats[key] += value;
                        }
                    }
                }
            }
        }

        const equipment = EquipmentComponent.oneFrom(entity)?.data;
        if (equipment) {
            for (const slot in equipment) {
                const itemId = equipment[slot as keyof typeof equipment];
                if (!itemId) continue;

                const itemEntity = this.world.getEntity(parseInt(itemId, 10));
                if (!itemEntity) continue;

                const equipable = EquipableComponent.oneFrom(itemEntity)?.data;
                if (equipable?.baseStats) {
                    for (const stat in equipable.baseStats) {
                        finalStats[stat as keyof typeof finalStats] += equipable.baseStats[stat];
                    }
                }
                // Here you would also add logic to parse affixes and add their stats.
            }
        }

        const activeTraits = ActiveTraitsComponent.oneFrom(entity)?.data.traitIds;
        if (activeTraits && this.content.traits) {
            for (const traitId of activeTraits) {
                const traitData = this.content.traits.get(traitId);
                if (traitData && traitData.trigger === 'ALWAYS') {
                    for (const effect of traitData.effects) {
                        if (effect.type === 'MODIFY_STAT' && effect.stat && effect.value) {
                            // --- AND FIX IS HERE ---
                            const key = effect.stat as keyof typeof finalStats;

                            if (effect.valueType === 'PERCENT') {
                                finalStats[key] *= (1 + effect.value);
                            } else { // FLAT
                                finalStats[key] += effect.value;
                            }
                        }
                    }
                }
            }
        }

        const activeEffects = ActiveEffectComponent.oneFrom(entity)?.data;
        if (activeEffects) {
            const flatModifiers: { [key: string]: number } = {};
            const percentModifiers: { [key: string]: number } = {};

            // First, aggregate all modifiers
            for (const effect of activeEffects) {
                const effectDefEntity = this.content.effects.get(effect.effectId);
                const effectDef = EffectDefinitionComponent.oneFrom(effectDefEntity!)?.data;
                const mod = effectDef?.statModifier;

                if (mod) {
                    const stat = mod.stat as keyof typeof finalStats;
                    if (mod.valueType === 'FLAT') {
                        flatModifiers[stat] = (flatModifiers[stat] || 0) + mod.value;
                    } else if (mod.valueType === 'PERCENT') {
                        percentModifiers[stat] = (percentModifiers[stat] || 0) + mod.value;
                    }
                }
            }

            // Apply flat modifiers first
            for (const stat in flatModifiers) {
                finalStats[stat as keyof typeof finalStats] += flatModifiers[stat];
            }
            // Then apply percent modifiers
            for (const stat in percentModifiers) {
                const baseValue = finalStats[stat as keyof typeof finalStats];
                finalStats[stat as keyof typeof finalStats] += baseValue * percentModifiers[stat];
            }
        }

        Object.keys(finalStats).forEach(key => {
            const statKey = key as keyof typeof finalStats;
            finalStats[statKey] = Math.round(finalStats[statKey]);
        });

        const healthComponent = HealthComponent.oneFrom(entity)?.data;
        if (healthComponent) {
            const isFirstCalc = healthComponent.max <= 1;
            healthComponent.max = finalStats.health;
            if (isFirstCalc) {
                healthComponent.current = finalStats.health;
            }
        }

        entity.add(new DerivedStatsComponent(finalStats));
        console.log(`Stats recalculated for entity ${entity.id}`);
    }
}
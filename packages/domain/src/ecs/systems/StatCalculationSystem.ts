import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import {
    CoreStatsComponent,
    DerivedStatsComponent,
    EquipmentComponent,
    HealthComponent,
    ManaComponent,
} from '../components/character';
import { EquipableComponent } from '../components/item';
import { ActiveEffectComponent } from '../components/combat';
import { EffectDefinitionComponent } from '../components/effects';
import { type MobArchetypeData, ActiveTraitsComponent } from '../components/mob';
import { type TraitData } from '../components/traits';
import { type GameConfig } from '../../ContentService';

/** The keys we store in DerivedStats (no resource pools here) */
type DerivedKeys =
    | 'attack' | 'magicAttack' | 'defense' | 'magicResist'
    | 'critChance' | 'critDamage' | 'dodge' | 'haste' | 'accuracy';

type DerivedMap = Record<DerivedKeys, number>;
type CapacityKeys = 'health' | 'mana';
type AnyStatKey = DerivedKeys | CapacityKeys;

export class StatCalculationSystem {
    private world: ECS;
    private eventBus: EventBus;
    private content: {
        effects: Map<string, any>;
        traits: Map<string, TraitData>;
        config: GameConfig;
    };
    private config: GameConfig;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;
        this.config = loadedContent.config;

        eventBus.on('characterEquipmentChanged', this.onCharacterChange.bind(this));
        eventBus.on('effectApplied', this.onCharacterChange.bind(this));
    }

    private onCharacterChange(payload: { characterId?: number; targetId?: string }): void {
        const id = payload.characterId ?? (payload.targetId ? parseInt(payload.targetId, 10) : undefined);
        if (id === undefined) return;
        const character = this.world.getEntity(id);
        if (character) this.update(character);
    }

    public update(entity: Entity, archetypes?: MobArchetypeData[]): void {
        const core = CoreStatsComponent.oneFrom(entity)?.data;

        if (!core) return;

        // ---- Base calculations from config ----
        const derived: DerivedMap = {
            attack: core.strength * this.config.stat_scalings.attack_from_strength,
            magicAttack: core.intelligence * this.config.stat_scalings.magic_attack_from_intelligence,
            defense: core.dexterity * this.config.stat_scalings.defense_from_dexterity,
            magicResist: core.intelligence * this.config.stat_scalings.magic_resist_from_intelligence,
            critChance: this.config.base_stats.crit_chance,
            critDamage: this.config.base_stats.crit_damage,
            dodge: core.dexterity * this.config.stat_scalings.dodge_from_dexterity,
            haste: this.config.base_stats.haste,
            accuracy: this.config.base_stats.accuracy,
        };

        // Resource capacities (NOT stored in DerivedStats)
        let healthCap = core.strength * this.config.stat_scalings.health_from_strength;
        let manaCap = core.intelligence * this.config.stat_scalings.mana_from_intelligence;

        // Helpers to route stat modifications
        const applyFlat = (key: AnyStatKey, value: number) => {
            if (key === 'health') healthCap += value;
            else if (key === 'mana') manaCap += value;
            else derived[key as DerivedKeys] += value;
        };
        const applyPercent = (key: AnyStatKey, value: number) => {
            if (key === 'health') healthCap *= value;         // archetype.percent assumed multiplicative (e.g., 1.10)
            else if (key === 'mana') manaCap *= value;
            else derived[key as DerivedKeys] *= value;
        };
        const applyPercentAdditive = (key: AnyStatKey, value: number) => {
            // effects/traits that give +X% typically arrive as 0.10; multiply by (1+value)
            if (key === 'health') healthCap *= (1 + value);
            else if (key === 'mana') manaCap *= (1 + value);
            else derived[key as DerivedKeys] *= (1 + value);
        };

        // ---- Archetype modifiers ----
        if (archetypes) {
            for (const arch of archetypes) {
                if (!arch.modifiers) continue;
                for (const [stat, value] of Object.entries(arch.modifiers)) {
                    const [statName, modType] = stat.split('_'); // e.g., "attack_percent"
                    const key = statName as AnyStatKey;
                    if (modType === 'percent') applyPercent(key, value as number);
                    else if (modType === 'flat') applyFlat(key, value as number);
                }
            }
        }

        // ---- Equipment base stats ----
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
                        const key = stat as AnyStatKey;
                        const val = equipable.baseStats[stat];
                        applyFlat(key, val);
                    }
                }
                // TODO: affixes & special rules
            }
        }

        // ---- Traits (ALWAYS trigger) ----
        const activeTraits = ActiveTraitsComponent.oneFrom(entity)?.data.traitIds;
        if (activeTraits && this.content.traits) {
            for (const traitId of activeTraits) {
                const traitData = this.content.traits.get(traitId);
                if (!traitData || traitData.trigger !== 'ALWAYS') continue;
                for (const effect of traitData.effects) {
                    if (effect.type === 'MODIFY_STAT' && effect.stat && effect.value != null) {
                        const key = effect.stat as AnyStatKey;
                        if (effect.valueType === 'PERCENT') applyPercentAdditive(key, effect.value);
                        else applyFlat(key, effect.value); // FLAT
                    }
                }
            }
        }

        // ---- Active effects (aggregate) ----
        const flatMods: Partial<Record<AnyStatKey, number>> = {};
        const pctMods: Partial<Record<AnyStatKey, number>> = {};

        const activeEffects = ActiveEffectComponent.oneFrom(entity)?.data;
        if (activeEffects) {
            for (const eff of activeEffects) {
                const effectDefEntity = this.content.effects.get(eff.effectId);
                const effectDef = EffectDefinitionComponent.oneFrom(effectDefEntity!)?.data;
                const mod = effectDef?.statModifier;
                if (!mod) continue;

                const key = mod.stat as AnyStatKey;
                if (mod.valueType === 'FLAT') {
                    flatMods[key] = (flatMods[key] ?? 0) + mod.value;
                } else if (mod.valueType === 'PERCENT') {
                    pctMods[key] = (pctMods[key] ?? 0) + mod.value; // e.g., +0.10 means +10%
                }
            }

            // Apply flat then percent
            for (const k in flatMods) applyFlat(k as AnyStatKey, flatMods[k as AnyStatKey]!);
            for (const k in pctMods) applyPercentAdditive(k as AnyStatKey, pctMods[k as AnyStatKey]!);
        }

        // ---- Rounding ----
        (Object.keys(derived) as DerivedKeys[]).forEach(key => {
            derived[key] = Math.round(derived[key]);
        });
        healthCap = Math.max(0, Math.round(healthCap));
        manaCap = Math.max(0, Math.round(manaCap));

        // ---- Update resource components ----
        const health = HealthComponent.oneFrom(entity)?.data;
        const mana = ManaComponent.oneFrom(entity)?.data;

        if (health) {
            const first = !Number.isFinite(health.max) || health.max <= 1;
            health.max = healthCap;
            if (first) health.current = healthCap;
            else health.current = Math.min(health.current, health.max);
        }

        if (mana) {
            const first = !Number.isFinite(mana.max) || mana.max <= 1;
            mana.max = manaCap;
            if (first) mana.current = manaCap;
            else mana.current = Math.min(mana.current, mana.max);
        }

        // *** FIX: Remove the old component before adding the new one ***
        const derivedStatsComp = DerivedStatsComponent.oneFrom(entity);
        if (derivedStatsComp) {
            entity.remove(derivedStatsComp);
        }
        entity.add(new DerivedStatsComponent(derived));
    }
}


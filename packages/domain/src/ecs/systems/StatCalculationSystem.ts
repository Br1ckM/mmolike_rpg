import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import {
    CoreStatsComponent,
    DerivedStatsComponent,
    EquipmentComponent,
    HealthComponent,
    ManaComponent,
    InfoComponent,
} from '../components/character';
import { EquipableComponent } from '../components/item';
import { ActiveEffectComponent } from '../components/combat';
import { EffectDefinitionComponent } from '../components/effects';
import { type MobArchetypeData } from '../components/mob';
import { type GameConfig, type AncestryData } from '../../ContentService';
import { GameSystem } from './GameSystem'; // Import the new base class

type DerivedKeys =
    | 'attack' | 'magicAttack' | 'defense' | 'magicResist'
    | 'critChance' | 'critDamage' | 'dodge' | 'speed' | 'accuracy';

type DerivedMap = Record<DerivedKeys, number>;
type CapacityKeys = 'health' | 'mana';
type AnyStatKey = DerivedKeys | CapacityKeys;

export class StatCalculationSystem extends GameSystem { // Extend GameSystem
    private content: {
        effects: Map<string, any>;
        traits: Map<string, any>; // Assuming TraitData is defined elsewhere
        config: GameConfig;
        ancestries?: Map<string, AncestryData>;
    };
    private config: GameConfig;

    constructor(world: ECS, eventBus: EventBus, loadedContent: any) {
        // This system is event-driven but also has a public update method.
        super(world, eventBus, []);

        this.content = loadedContent;
        this.config = loadedContent.config;

        // Use the inherited 'subscribe' method
        this.subscribe('characterEquipmentChanged', this.onCharacterChange.bind(this));
        this.subscribe('effectApplied', this.onCharacterChange.bind(this));
    }

    private onCharacterChange(payload: { characterId?: number; targetId?: string }): void {
        const id = payload.characterId ?? (payload.targetId ? parseInt(payload.targetId, 10) : undefined);
        if (id === undefined) return;
        const character = this.world.getEntity(id);
        if (character) this.calculateAndApplyStats(character);
    }

    public calculateAndApplyStats(entity: Entity, archetypes?: MobArchetypeData[]): void {
        const core = CoreStatsComponent.oneFrom(entity)?.data;
        const info = InfoComponent.oneFrom(entity)?.data;

        if (!core) return;

        const modifiedCore = { ...core };

        if (info?.ancestryId) {
            const ancestryData = this.content.ancestries?.get(info.ancestryId);
            if (ancestryData?.statModifiers) {
                modifiedCore.strength += ancestryData.statModifiers.strength || 0;
                modifiedCore.dexterity += ancestryData.statModifiers.dexterity || 0;
                modifiedCore.intelligence += ancestryData.statModifiers.intelligence || 0;
            }
        }

        // --- The rest of the update logic remains exactly the same ---
        // ... (calculation code from derived stats down to Object.assign)

        const derived: DerivedMap = {
            attack: modifiedCore.strength * this.config.stat_scalings.attack_from_strength,
            magicAttack: modifiedCore.intelligence * this.config.stat_scalings.magic_attack_from_intelligence,
            defense: modifiedCore.dexterity * this.config.stat_scalings.defense_from_dexterity,
            magicResist: modifiedCore.intelligence * this.config.stat_scalings.magic_resist_from_intelligence,
            critChance: this.config.base_stats.crit_chance,
            critDamage: this.config.base_stats.crit_damage,
            dodge: modifiedCore.dexterity * this.config.stat_scalings.dodge_from_dexterity,
            speed: this.config.base_stats.speed,
            accuracy: this.config.base_stats.accuracy,
        };

        let healthCap = modifiedCore.strength * this.config.stat_scalings.health_from_strength;
        let manaCap = modifiedCore.intelligence * this.config.stat_scalings.mana_from_intelligence;

        const applyFlat = (key: AnyStatKey, value: number) => {
            if (key === 'health') healthCap += value;
            else if (key === 'mana') manaCap += value;
            else if (derived.hasOwnProperty(key)) derived[key as DerivedKeys] += value;
        };
        const applyPercentAdditive = (key: AnyStatKey, value: number) => {
            if (key === 'health') healthCap *= (1 + value);
            else if (key === 'mana') manaCap *= (1 + value);
            else if (derived.hasOwnProperty(key)) derived[key as DerivedKeys] *= (1 + value);
        };

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
                        applyFlat(stat as AnyStatKey, equipable.baseStats[stat]);
                    }
                }
            }
        }

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
                    pctMods[key] = (pctMods[key] ?? 0) + mod.value;
                }
            }
            for (const k in flatMods) applyFlat(k as AnyStatKey, flatMods[k as AnyStatKey]!);
            for (const k in pctMods) applyPercentAdditive(k as AnyStatKey, pctMods[k as AnyStatKey]!);
        }

        (Object.keys(derived) as DerivedKeys[]).forEach(key => {
            derived[key] = Math.round(derived[key]);
        });
        healthCap = Math.max(0, Math.round(healthCap));
        manaCap = Math.max(0, Math.round(manaCap));

        const health = HealthComponent.oneFrom(entity)?.data;
        const mana = ManaComponent.oneFrom(entity)?.data;

        if (health) {
            const isInitialCalculation = health.max <= 1;
            const healthPercent = isInitialCalculation ? 1 : health.current / health.max;
            health.max = healthCap;
            health.current = Math.round(health.max * healthPercent);
        }

        if (mana) {
            const isInitialCalculation = mana.max <= 1;
            const manaPercent = isInitialCalculation ? 1 : mana.current / mana.max;
            mana.max = manaCap;
            mana.current = Math.round(mana.max * manaPercent);
        }

        let derivedStatsComp = DerivedStatsComponent.oneFrom(entity);
        if (!derivedStatsComp) {
            derivedStatsComp = new DerivedStatsComponent(derived);
            entity.add(derivedStatsComp);
        } else {
            Object.assign(derivedStatsComp.data, derived);
        }
    }
}
import { Component } from 'ecs-lib';
import type { DerivedStatsData } from './character';

export type EffectType = 'BUFF' | 'DEBUFF' | 'DOT' | 'HOT';
export type EffectValueType = 'FLAT' | 'PERCENT';
export type EffectTickType = 'START_OF_TURN' | 'END_OF_TURN';

/**
 * Defines the static properties of a status effect, loaded from YAML.
 */
export interface EffectDefinitionData {
    name: string;
    description: string;
    type: EffectType;
    /** The stat this effect modifies (e.g., 'attack', 'defense'). */
    statModifier?: {
        stat: keyof DerivedStatsData;
        value: number;
        valueType: EffectValueType;
    };
    /** For DOTs/HOTs, the effect that triggers on each tick. */
    tickEffect?: {
        type: 'DAMAGE' | 'HEAL';
        power: number; // Base damage/heal per tick
    };
    /** How many turns the effect lasts by default. */
    baseDuration: number;
}


// --- COMPONENT REGISTRATION ---

export const EffectDefinitionComponent = Component.register<EffectDefinitionData>();
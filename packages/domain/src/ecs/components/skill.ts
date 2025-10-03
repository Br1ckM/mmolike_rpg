import { Component } from 'ecs-lib';
import type { DerivedStatsData } from './character';

// --- TYPE DEFINITIONS ---

export type ScalingStat = 'attack' | 'magicAttack';
export type TargetType = 'Enemy' | 'Ally' | 'Self';
export type EffectType = 'Damage' | 'Heal' | 'ApplyEffect';
export type TargetPattern = 'SINGLE' | 'ADJACENT' | 'FRONT_ROW' | 'BACK_ROW' | 'ALL_ENEMIES';

/** A flexible skill cost definition. */
export interface SkillCost {
    stat: keyof DerivedStatsData | 'health'; // Allow any derived stat or 'health'
    amount: number;
}


export interface SkillInfoData {
    name: string;
    description: string;
    iconName?: string;
}

/**
 * Defines the mechanical effect of a skill when used in combat.
 */
export interface SkillEffectData {
    type: EffectType;
    target: TargetType;
    targeting: {
        pattern: TargetPattern;
        maxTargets?: number; // For skills like "hit up to 3 random enemies"
    };
    power: number;
    scalingStat: ScalingStat;
    effectId?: string;
}

export interface SkillData {
    type: 'active' | 'passive';
    isFavorited?: boolean;
    /** An array of resource costs to use this skill. */
    costs?: SkillCost[];
    /** The combat effects of the skill. A skill can have multiple effects (e.g., damage AND apply a debuff). */
    effects: SkillEffectData[];
}

export interface ProgressionData {
    level: number;
    xp: number;
}

export interface EvolutionChoiceData {
    id: string;
    description: string;
}

export interface EvolutionLevelData {
    level: number;
    choices: EvolutionChoiceData[];
}

export interface EvolutionData {
    evolutions: EvolutionLevelData[];
}

/** Data for a list of skills, typically associated with a Job or Skill Tree. */
export interface SkillListData {
    skillIds: string[];
}

// --- COMPONENT REGISTRATIONS ---

export const SkillInfoComponent = Component.register<SkillInfoData>();
export const SkillComponent = Component.register<SkillData>();
export const ProgressionComponent = Component.register<ProgressionData>();
export const EvolutionComponent = Component.register<EvolutionData>();
export const SkillListComponent = Component.register<SkillListData>();
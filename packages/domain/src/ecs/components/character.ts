import { Component } from 'ecs-lib'
import type { ProgressionData } from './skill';

/* ---------- Identity & control ---------- */

export interface InfoData {
    name: string;
    race: string;
    avatarUrl: string;
}

export interface ControllableData {
    isPlayer: boolean;
}

/* ---------- Core & derived stats ---------- */

export interface CoreStatsData {
    strength: number;
    dexterity: number;
    intelligence: number;
}

/**
 * Derived, recomputed numbers (no current/max pools here).
 * NOTE: health/mana removed; use Health/Mana components for resource pools.
 */
export interface DerivedStatsData {
    attack: number;
    magicAttack: number;
    defense: number;
    magicResist: number;
    critChance: number;
    critDamage: number;
    dodge: number;
    haste: number;
    accuracy: number;
}

/* ---------- Resources (mutable pools) ---------- */

/** Generic resource pool with current and capacity (max). */
export interface ResourceData {
    current: number;
    max: number;
}

/** Data for an entity's current and maximum health points. */
export type HealthData = ResourceData;

/** Data for an entity's current and maximum mana points. */
export type ManaData = ResourceData;

/* ---------- Abilities & progression ---------- */

export interface SkillBookData {
    knownSkills: string[];
}

export type EquipmentSlot =
    | 'helm' | 'cape' | 'amulet' | 'armor' | 'belt' | 'gloves'
    | 'mainHand' | 'offHand' | 'ring1' | 'ring2' | 'boots'
    | 'charm1' | 'charm2' | 'charm3';

export type EquipmentData = {
    [key in EquipmentSlot]: string | null;
};

export interface JobsData {
    activeJobId: string;
    jobList: {
        id: string;
        name: string;
        level: number;
        xp: number;
        skills: string[];
    }[];
}

export interface InventoryData {
    bagIds: string[];
    walletId: string;
}

export interface ProfessionsData {
    knownProfessions: string[];
}

export interface ConsumableBeltData {
    itemIds: (string | null)[];
}

/* ---------- Component registrations ---------- */

export const InfoComponent = Component.register<InfoData>();
export const ControllableComponent = Component.register<ControllableData>();
export const CoreStatsComponent = Component.register<CoreStatsData>();
export const ProgressionComponent = Component.register<ProgressionData>();

// After removing health/mana here:
export const DerivedStatsComponent = Component.register<DerivedStatsData>();

export const EquipmentComponent = Component.register<EquipmentData>();
export const JobsComponent = Component.register<JobsData>();
export const InventoryComponent = Component.register<InventoryData>();
export const ProfessionsComponent = Component.register<ProfessionsData>();
export const SkillBookComponent = Component.register<SkillBookData>();
export const ConsumableBeltComponent = Component.register<ConsumableBeltData>();

// Resource components:
export const HealthComponent = Component.register<HealthData>();
export const ManaComponent = Component.register<ManaData>();

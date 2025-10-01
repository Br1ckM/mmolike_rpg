import { Component } from 'ecs-lib'

export interface InfoData {
    name: string;
    race: string;
    avatarUrl: string;
}

export interface ControllableData {
    isPlayer: boolean;
}

export interface CoreStatsData {
    strength: number;
    dexterity: number;
    intelligence: number;
}

export interface DerivedStatsData {
    health: number;
    mana: number;
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

/** Data for an entity's current and maximum health points. */
export interface HealthData {
    current: number;
    max: number;
}

export interface SkillBookData {
    knownSkills: string[];
}

export type EquipmentSlot = 'helm' | 'cape' | 'amulet' | 'armor' | 'belt' | 'gloves' | 'mainHand' | 'offHand' | 'ring1' | 'ring2' | 'boots' | 'charm1' | 'charm2' | 'charm3';

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

export const InfoComponent = Component.register<InfoData>();
export const ControllableComponent = Component.register<ControllableData>();
export const CoreStatsComponent = Component.register<CoreStatsData>();
export const DerivedStatsComponent = Component.register<DerivedStatsData>();
export const EquipmentComponent = Component.register<EquipmentData>();
export const JobsComponent = Component.register<JobsData>();
export const InventoryComponent = Component.register<InventoryData>();
export const ProfessionsComponent = Component.register<ProfessionsData>();
export const HealthComponent = Component.register<HealthData>();
export const SkillBookComponent = Component.register<SkillBookData>();
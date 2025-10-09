import { Component } from 'ecs-lib'
import { ProgressionComponent, type ProgressionData } from '../components/skill';

/* ---------- Identity & control ---------- */

export interface InfoData {
    id?: string;
    name: string;
    race: string;
    avatarUrl: string;
    ancestryId?: string;
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
 */
export interface DerivedStatsData {
    attack: number;
    magicAttack: number;
    defense: number;
    magicResist: number;
    critChance: number;
    critDamage: number;
    dodge: number;
    speed: number;
    accuracy: number;
}

/* ---------- Resources (mutable pools) ---------- */

export interface ResourceData {
    current: number;
    max: number;
}

export type HealthData = ResourceData;
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

/* ---------- Physical Appearance System ---------- */

export interface AppearanceAttribute {
    name: string;
    value: string | number;
    unit?: string;
    label: string;
    isSensitive?: boolean;
    isExtreme?: boolean;
}

export interface AppearanceComponentData {
    attributes: AppearanceAttribute[];
}

/* ---------- Vore Components (Refactored) ---------- */

export type VoreRole = 'Neither' | 'Prey' | 'Predator' | 'Both';
export type VoreMethodType = 'Oral' | 'Anal' | 'Cock' | 'Breast'; // The METHOD of vore
export type VoreContainerType = 'Stomach' | 'Bowels' | 'Womb' | 'Breasts'; // The CONTAINER for prey

/** Tracks the character's primary Vore role preference. */
export interface VoreRoleComponentData {
    role: VoreRole;
}

/** Defines the current state of a vore container. */
export interface VoreContainerData {
    capacity: number;
    contents: StomachContent[];
    digestionRate: number;
}

/** An entry for a single entity currently held inside a container. */
export interface StomachContent {
    entityId: number;
    name: string;
    size: number;
    digestionTimer: number;
    preyData: PreyComponentData;
}

/** Identifies an entity as a capable Predator. */
export interface PredatorComponentData {
    /** The vore skills/methods this predator can perform. e.g. ['skill_devour_oral'] */
    availableVoreSkills: string[];
}

/** Identifies an entity as a viable Prey item. */
export interface PreyComponentData {
    name: string;
    size: number;
    digestionTime: number;
    nutritionValue: number;
    strugglePower: number;
    onDigestedEffects?: string[];
}

/** Holds all vore containers for a Predator, keyed by the container type. */
export type VoreComponentData = Partial<Record<VoreContainerType, VoreContainerData>>;


/* ---------- Component registrations ---------- */

export const InfoComponent = Component.register<InfoData>();
export const ControllableComponent = Component.register<ControllableData>();
export const CoreStatsComponent = Component.register<CoreStatsData>();

export const DerivedStatsComponent = Component.register<DerivedStatsData>();

export const EquipmentComponent = Component.register<EquipmentData>();
export const JobsComponent = Component.register<JobsData>();
export const InventoryComponent = Component.register<InventoryData>();
export const ProfessionsComponent = Component.register<ProfessionsData>();
export const SkillBookComponent = Component.register<SkillBookData>();
export const ConsumableBeltComponent = Component.register<ConsumableBeltData>();
export const AppearanceComponent = Component.register<AppearanceComponentData>();

export const HealthComponent = Component.register<HealthData>();
const _ManaComponent = Component.register<ManaData>();

export class ManaComponent extends _ManaComponent {
    constructor(data?: Partial<ManaData>) {
        const max = data?.max ?? 0;
        const current = typeof data?.current === 'number' ? data!.current : max;
        super({ current, max });
    }
}

// Vore components:
export const VoreRoleComponent = Component.register<VoreRoleComponentData>();
export const PredatorComponent = Component.register<PredatorComponentData>();
export const PreyComponent = Component.register<PreyComponentData>();
export const VoreComponent = Component.register<VoreComponentData>();


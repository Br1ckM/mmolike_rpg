import { Component } from 'ecs-lib';
import { AIBehaviorProfile } from './combat';

// --- DATA STRUCTURES (for content files, e.g., YAML) ---

/** Defines the power level and innate traits of a tier. */
export interface MobTierData {
    id: 'Fodder' | 'Standard' | 'Elite' | 'Boss';
    name: string;
    statPointMultiplier: number;
    traits?: string[];
}

/** Defines the stat allocation and AI of an archetype. */
export interface MobArchetypeData {
    id: string; // e.g., 'BRUT', 'CAST'
    name: string;
    aiProfile: AIBehaviorProfile;
    /** Defines allocation for [STR, DEX, INT]. MUST sum to 1.0. */
    allocation: [number, number, number];
    /** Optional stat modifiers applied after allocation. */
    modifiers?: {
        [statName: string]: number; // e.g., { health_percent: 1.15, defense_flat: 5 }
    };
}

/** Defines the stat boosts and common loot pools for a family. */
export interface MobFamilyData {
    id: string; // e.g., 'FAM-BUN'
    name: string;
    /** Defines percentage boosts for [STR, DEX, INT]. Should sum to a budget (e.g., 0.3). */
    boosts: [number, number, number];
    lootPools: string[];
    traits?: string[];
}

// --- COMPONENTS ---

/**
 * A component to identify an entity as a mob and store its generative origins.
 * Useful for debugging and potentially for game mechanics.
 */
export interface MobComponentData {
    protoId: string;
    familyId: string;
    tier: MobTierData['id'];
    archetypes: string[];
}
export const MobComponent = Component.register<MobComponentData>();


/** A component to hold the final, combined list of loot table IDs for a mob. */
export interface LootTableComponentData {
    tableIds: string[];
}
export const LootTableComponent = Component.register<LootTableComponentData>();


/** A component to hold a list of innate, passive traits. */
export interface ActiveTraitsComponentData {
    traitIds: string[];
}
export const ActiveTraitsComponent = Component.register<ActiveTraitsComponentData>();
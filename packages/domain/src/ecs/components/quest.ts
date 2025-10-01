import { Component } from 'ecs-lib';

/** Defines the static, shareable data for a quest, loaded from YAML. */
export interface QuestData {
    name: string;
    description: string;
    suggestedLevel: number;
}

/** Defines the structure for a single objective within a quest. */
export interface QuestObjectiveData {
    type: 'kill' | 'fetch' | 'talkTo';
    targetId: string; // e.g., 'enemy_goblin_scout' or 'baseitem_wolf_pelt'
    targetName: string;
    requiredAmount: number;
}

/** Tracks a character's progress on a specific quest. This is unique to each player. */
export interface QuestStatusData {
    questId: string;
    status: 'available' | 'in_progress' | 'completed' | 'turned_in';
    objectiveProgress: number[]; // An array of numbers, matching the order of objectives
}

/** Defines the rewards for completing a quest. */
export interface QuestRewardData {
    experience: number;
    gold?: number;
    // An array of item IDs to be generated and given to the player
    itemIds?: string[];
}

/** A component for entities that can give quests (e.g., NPCs). */
export interface QuestGiverData {
    questIds: string[];
}

export interface QuestStateTriggerData {
    status: 'in_progress' | 'completed' | 'turned_in';
    action: 'SPAWN_ENTITY' | 'DESPAWN_ENTITY' | 'ENABLE_INTERACTION';
    targetId: string;
}

// --- COMPONENT REGISTRATIONS ---

export const QuestComponent = Component.register<QuestData>();
export const QuestObjectiveComponent = Component.register<QuestObjectiveData[]>();
export const QuestStatusComponent = Component.register<QuestStatusData>();
export const QuestRewardComponent = Component.register<QuestRewardData>();
export const QuestGiverComponent = Component.register<QuestGiverData>();
export const QuestStateTriggerComponent = Component.register<QuestStateTriggerData[]>();
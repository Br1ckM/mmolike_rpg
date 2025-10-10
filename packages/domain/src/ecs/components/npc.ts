import { Component } from 'ecs-lib';
import { TimeOfDay } from './world'

/**
 * Common reusable literal unions for NPC components.
 */
export type QuestStatus = 'in_progress' | 'completed';
export type ServiceType = 'BANK' | 'TELEPORT';

/**
 * The entry point for any conversation with an NPC.
 */
export interface DialogueComponentData {
    /** The ID of a dialogue tree, likely defined in a separate YAML content file. */
    dialogueTreeId: string;
}

/**
 * Gives an NPC the ability to act as a merchant, buying and selling items.
 */
export interface VendorComponentData {
    /** The entity ID of an inventory container holding the vendor's for-sale items. */
    inventoryId: string;
    /** An optional modifier to adjust the prices of items the vendor buys from players. */
    buyPriceModifier?: number;
}

/**
 * Allows an NPC to teach skills or unlock jobs for the player.
 */
export interface TrainerComponentData {
    /** A list of skill IDs that can be learned from this NPC. */
    trainableSkillIds?: string[];
    /** A list of job IDs that can be unlocked by this NPC. */
    trainableJobIds?: string[];
}

/**
 * A generic component for specialized NPC services like banking or teleportation.
 */
export interface ServiceProviderComponentData {
    serviceType: ServiceType;
    /** For TELEPORT services, the ID of the destination location container. */
    destinationId?: string;
}

/**
 * Manages an NPC's abstract location based on a schedule and quest states.
 */
export interface ScheduleComponentData {
    /** The NPC's current location, represented by a location container ID. */
    currentLocationId: string;

    /** The default schedule based on the time of day. */
    defaultSchedule: {
        time: TimeOfDay;
        locationId: string; // e.g., "location_mayors_house"
    }[];

    /** Overrides that place the NPC in a specific location if a certain quest is active. */
    questOverrides?: {
        questId: string;
        questStatus: QuestStatus;
        locationId: string; // e.g., "location_timberbrook_fields_quest_zone"
    }[];
}

export interface CompanionComponentData {
    recruited: boolean;
    inActiveParty: boolean;
    affinity: number;
    campDialogueTreeId: string;
}

// --- COMPONENT REGISTRATIONS ---

export const DialogueComponent = Component.register<DialogueComponentData>();
export const VendorComponent = Component.register<VendorComponentData>();
export const TrainerComponent = Component.register<TrainerComponentData>();
export const ServiceProviderComponent = Component.register<ServiceProviderComponentData>();
export const ScheduleComponent = Component.register<ScheduleComponentData>();
export const CompanionComponent = Component.register<CompanionComponentData>();
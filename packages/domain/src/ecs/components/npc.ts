import { Component } from 'ecs-lib';

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
    serviceType: 'BANK' | 'TELEPORT';
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
        time: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
        locationId: string; // e.g., "location_mayors_house"
    }[];

    /** Overrides that place the NPC in a specific location if a certain quest is active. */
    questOverrides?: {
        questId: string;
        questStatus: 'in_progress' | 'completed';
        locationId: string; // e.g., "location_timberbrook_fields_quest_zone"
    }[];
}


// --- COMPONENT REGISTRATIONS ---

export const DialogueComponent = Component.register<DialogueComponentData>();
export const VendorComponent = Component.register<VendorComponentData>();
export const TrainerComponent = Component.register<TrainerComponentData>();
export const ServiceProviderComponent = Component.register<ServiceProviderComponentData>();
export const ScheduleComponent = Component.register<ScheduleComponentData>();
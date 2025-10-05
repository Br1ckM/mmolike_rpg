import { Component } from 'ecs-lib';

export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

/** A location is a persistent, returnable place in the world. */
export type LocationType = 'Zone' | 'Hub';

/** An interaction is an immediate, transactional event that happens at a node. */
export type InteractionType = 'Gather' | 'Encounter' | 'Den' | 'Dungeon' | 'Hunt';

/**
 * A component that identifies an entity as a discoverable point of interest (a "node").
 */
export interface NodeComponentData {
    name: string;
    description: string;
    position?: {
        top: string;
        left: string;
    };
}

/**
 * A component for nodes that, when interacted with, transport the player to a new persistent Location.
 */
export interface TravelTargetComponentData {
    targetLocationId: string;
}

/**

 * A component for nodes that, when interacted with, trigger an immediate, transactional event
 * like gathering resources, starting an encounter, or entering a Den/Dungeon modal.
 */
export interface InteractionTargetComponentData {
    type: InteractionType;
    /** The ID of a loot table, encounter, Den, or Dungeon definition. */
    targetId: string;
}

/**
 * Defines a persistent location in the world (a Zone or a Hub).
 */
export interface LocationComponentData {
    name: string;
    description: string;
    type: LocationType;
    isSafeZone: boolean;
    parentLocationId?: string;
}

/**
 * A generic component that holds a list of other entity IDs "inside" a Location.
 */
export interface ContainerComponentData {
    containedEntityIds: string[];
}

/**
 * A component for the player entity that tracks their current persistent location in the world.
 * This should NOT be used for temporary states like being in a Den or Dungeon.
 */
export interface PlayerLocationComponentData {
    currentZoneId: string;
    currentSubLocationId: string; // The Hub the player is currently in, within the Zone.
}

/**

 * A component to be placed on a single "world" entity to track the
 * current time of day.
 */
export interface WorldClockComponentData {
    currentTime: TimeOfDay;
}


// --- COMPONENT REGISTRATIONS ---

export const NodeComponent = Component.register<NodeComponentData>();
export const TravelTargetComponent = Component.register<TravelTargetComponentData>();
export const InteractionTargetComponent = Component.register<InteractionTargetComponentData>();
export const LocationComponent = Component.register<LocationComponentData>();
export const ContainerComponent = Component.register<ContainerComponentData>();
export const PlayerLocationComponent = Component.register<PlayerLocationComponentData>();
export const WorldClockComponent = Component.register<WorldClockComponentData>();


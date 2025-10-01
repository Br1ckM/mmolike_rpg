import { Component } from 'ecs-lib';

export type AIBehaviorProfile = 'Aggressor' | 'Healer' | 'Tank';

/**
 * A component added to an entity when it enters combat. It holds all
 * state relevant to the active battle and is removed when combat ends.
 */
export interface CombatantComponentData {
    teamId: string; // e.g., "player_team" or "enemy_team"
    row: 'Front' | 'Back';
    initiative: number; // A roll to determine turn order, calculated at the start of combat.
    hasTakenAction: boolean; // Tracks if this combatant has acted in the current round.
}

/**
 * A component placed on a single, temporary "Combat" entity. It acts as the
 * central state manager for the entire encounter.
 */
export interface CombatComponentData {
    /** A list of all entity IDs involved in the battle. */
    combatants: string[];
    /** The entity IDs sorted by initiative to determine turn order. */
    turnQueue: string[];
    /** The index in the turnQueue of the currently active combatant. */
    currentTurnIndex: number;
    /** The current round number of the combat. */
    roundNumber: number;
}

/**
 * A component to track a temporary status effect on a combatant, such as
 * "Poisoned", "Stunned", or a stat buff/debuff.
 */
export interface ActiveEffectComponentData {
    effectId: string; // The base ID of the effect, e.g., "effect_poison_t1"
    name: string; // The display name, e.g., "Poison"
    sourceId: string; // The entity ID of the character who applied the effect.
    durationInTurns: number; // How many turns the effect will last.
}

/**
 * A component added to any non-player entity to give it a behavior profile.
 * The AISystem will read this component to determine how the entity should act in combat.
 */
export interface AIProfileComponentData {
    profile: AIBehaviorProfile;
}


// --- COMPONENT REGISTRATIONS ---

export const CombatantComponent = Component.register<CombatantComponentData>();
export const CombatComponent = Component.register<CombatComponentData>();
export const ActiveEffectComponent = Component.register<ActiveEffectComponentData[]>(); // An entity can have multiple effects
export const AIProfileComponent = Component.register<AIProfileComponentData>();
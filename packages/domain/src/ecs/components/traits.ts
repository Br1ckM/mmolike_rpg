import { Component } from 'ecs-lib';

// --- DATA STRUCTURES (for content files, e.g., traits.yaml) ---

/** The event that causes a trait to activate. */
export type TraitTrigger =
    | 'ON_TURN_START'        // Activates at the beginning of the owner's turn.
    | 'ON_DAMAGE_DEALT'      // Activates when the owner deals damage.
    | 'ON_DAMAGE_TAKEN'      // Activates when the owner receives damage.
    | 'ON_HEAL_DEALT'        // Activates when the owner heals a target.
    | 'ON_EFFECT_APPLIED'    // Activates when the owner applies a status effect.
    | 'ALWAYS'               // A passive, constant effect.

/** The action the trait performs when triggered. */
export type TraitEffectType =
    | 'APPLY_EFFECT'         // Applies a status effect to a target.
    | 'MODIFY_STAT'          // Modifies a derived stat (e.g., +10% attack).
    | 'HEAL'                 // Heals the owner or target.
    | 'REFLECT_DAMAGE'       // Reflects a percentage of damage taken.

/** The target of the trait's effect. */
export type TraitTarget = 'SELF' | 'ATTACKER' | 'TARGET';

export interface TraitEffect {
    type: TraitEffectType;
    target: TraitTarget;
    // --- Effect-specific data ---
    effectId?: string;       // For APPLY_EFFECT
    stat?: string;           // For MODIFY_STAT (e.g., "attack")
    value?: number;          // For MODIFY_STAT, HEAL, REFLECT_DAMAGE
    valueType?: 'FLAT' | 'PERCENT'; // For MODIFY_STAT
    chance?: number;         // An optional chance (0-1) for the effect to occur.
}

/** The complete definition for a single passive trait. */
export interface TraitData {
    id: string;              // e.g., "trait_enrage"
    name: string;
    description: string;
    trigger: TraitTrigger;
    effects: TraitEffect[];  // A trait can have multiple effects
}

export const TraitDefinitionComponent = Component.register<TraitData>();
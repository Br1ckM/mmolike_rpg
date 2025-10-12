export type CombatId = string;

export type CombatantDTO = {
    id: number | string;
    name?: string;
    hp?: { current: number; max: number };
    SkillBookComponent?: { knownSkills: any[]; hydratedSkills?: any[] };
};

export type CombatDTO = {
    combatEntityId: string | null;
    combatants: Array<CombatantDTO | null>;
    // keep it flexible for now
    [k: string]: any;
};

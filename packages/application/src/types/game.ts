export interface PlayerState {
    id?: string | number;
    name?: string;
    health?: any;
    mana?: any;
    coreStats?: Record<string, any>;
    derivedStats?: Record<string, any>;
    progression?: Record<string, any>;
    equipment?: Record<string, string | number | null>;
    equippedItems?: Record<string, any>;
    inventory?: any;
    quests?: any[];
    skillBook?: any;
    vore?: any;
    ancestry?: any;
    AppearanceComponent?: any;
    VoreRoleComponent?: any;
    consumableBelt?: any;
    companions?: any[];
}

export interface HubState {
    zoneId?: string;
    location?: any;
    npcs?: any[];
    nodes?: any[];
}

export interface CombatState {
    combatEntityId?: string | null;
    combatants?: any[];
    // additional combat fields as needed
}

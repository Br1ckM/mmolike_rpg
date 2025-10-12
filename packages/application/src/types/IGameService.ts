import type { PlayerState, HubState, CombatState } from './game';

export interface IGameService {
    // Optional lifecycle hooks
    init?: () => Promise<void> | void;
    start?: () => Promise<void> | void;
    stop?: () => Promise<void> | void;

    // State accessors used by application/tests — return the concrete DTO shapes
    getCombatState?: (combatId?: string) => CombatState | null | undefined;
    getHubState?: (playerId?: string) => HubState | null | undefined;
    getPlayerState?: (playerId?: string) => PlayerState | null | undefined;

    // Minimal event adapter surface (optional)
    on?: (event: string, handler: (...args: any[]) => void) => void;
    off?: (event: string, handler: (...args: any[]) => void) => void;
    emit?: (event: string, ...args: any[]) => void;
}
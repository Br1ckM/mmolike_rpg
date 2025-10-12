import { EventEmitter } from 'events';
import type { CombatDTO } from './types';

// Minimal facade for combat domain within the Application package.
// This is intentionally small and dependency-free so the rest of the app
// can import it while domain logic is incrementally migrated.

export class CombatService extends EventEmitter {
    private _combats: Map<string, CombatDTO> = new Map();

    startCombat(combatId: string, payload: Partial<CombatDTO> = {}) {
        const dto: CombatDTO = {
            combatEntityId: combatId,
            combatants: payload.combatants || [],
            ...payload,
        };
        this._combats.set(combatId, dto);
        this.emit('combat.started', dto);
        this.emit('combat.updated', dto);
        return dto;
    }

    endCombat(combatId: string) {
        const dto = this._combats.get(combatId) || null;
        this._combats.delete(combatId);
        this.emit('combat.ended', dto);
        return dto;
    }

    getCombatState(combatId: string): CombatDTO | null {
        return this._combats.get(combatId) || null;
    }

    publishUpdate(combatId: string, dto: Partial<CombatDTO>) {
        const existing = this._combats.get(combatId) || { combatEntityId: combatId, combatants: [] };
        const merged = { ...existing, ...dto } as CombatDTO;
        this._combats.set(combatId, merged);
        this.emit('combat.updated', merged);
        return merged;
    }
}

export default CombatService;

import { describe, it, expect, vi } from 'vitest';
import { PlayerService } from '../../src/domains/player/PlayerService';
import type { ICommandService } from '../../src/services/CommandService';
import type { IQueryService } from '../../src/services/QueryService';

// Helper to create a minimal ICommandService mock that satisfies the interface
function makeCommandMock(overrides: Partial<ICommandService> = {}): ICommandService {
    const base: any = {
        // Equipment/inventory
        equipItem: vi.fn().mockResolvedValue(null),
        unequipItem: vi.fn().mockResolvedValue(null),
        useItemInBelt: vi.fn().mockResolvedValue(null),
        moveInventoryItem: vi.fn().mockResolvedValue(null),
        // Player management
        setPlayerVoreRole: vi.fn().mockResolvedValue(null),
        // Game state
        loadGame: vi.fn().mockResolvedValue(null),
        saveGame: vi.fn().mockResolvedValue(null),
        exportSave: vi.fn().mockResolvedValue(null),
        importSave: vi.fn().mockResolvedValue(null),
        // Creation / filters
        createCharacter: vi.fn().mockResolvedValue(null),
        updateContentFilter: vi.fn().mockResolvedValue(null),
        // Exploration
        exploreInZone: vi.fn().mockResolvedValue(null),
        interactWithNode: vi.fn().mockResolvedValue(null),
        // Combat/actions
        regurgitate: vi.fn().mockResolvedValue(null),
        dev_addPreyToStomach: vi.fn().mockResolvedValue(null),
        restAtCamp: vi.fn().mockResolvedValue(null),
        initiateDialogue: vi.fn().mockResolvedValue(null),
        swapCompanion: vi.fn().mockResolvedValue(null),
        defend: vi.fn().mockResolvedValue(null),
        flee: vi.fn().mockResolvedValue(null),
        performSkill: vi.fn().mockResolvedValue(null),
        // Dialogue
        selectDialogueResponse: vi.fn().mockResolvedValue(null),
    };
    return Object.assign(base, overrides) as ICommandService;
}

// Helper for IQueryService
function makeQueryMock(overrides: Partial<IQueryService> = {}): IQueryService {
    const base: any = {
        subscribe: vi.fn(),
        getPlayerState: vi.fn().mockResolvedValue(null),
        get: vi.fn().mockResolvedValue(null),
        getStaticContent: vi.fn().mockResolvedValue(null),
    };
    return Object.assign(base, overrides) as IQueryService;
}

describe('PlayerService (unit)', () => {
    it('forwards equipItem to ICommandService', async () => {
        const mockCommands = makeCommandMock({ equipItem: vi.fn().mockResolvedValue({ ok: true }) });
        const mockQueries = makeQueryMock({ subscribe: vi.fn() as any, getPlayerState: vi.fn() as any, get: vi.fn() as any });

        const svc = new PlayerService(mockCommands, mockQueries);
        const res = await svc.equipItem(123, 456);

        expect((mockCommands.equipItem as any)).toHaveBeenCalledWith(123, 456);
        expect(res).toEqual({ ok: true });
    });

    it('re-emits playerState subscription events', () => {
        const subscribeStub = vi.fn((topic, handler) => {
            // simulate immediate call
            handler({ id: 1, name: 'Player' });
            return () => { }; // unsubscribe
        });
        const mockQueries: IQueryService = makeQueryMock({ subscribe: subscribeStub as any, get: vi.fn() as any });
        const mockCommands = {} as any;

        const svc = new PlayerService(mockCommands, mockQueries);
        const handler = vi.fn();
        svc.on('playerState', handler);

        svc.subscribePlayerState(() => { /* no-op */ });

        expect(handler).toHaveBeenCalledWith({ id: 1, name: 'Player' });
        expect(subscribeStub).toHaveBeenCalledWith('playerState', expect.any(Function));
    });
});

describe('PlayerService additional tests', () => {
    it('uses queries.getPlayerState when available', async () => {
        const mockQueries: IQueryService = makeQueryMock({ subscribe: vi.fn() as any, getPlayerState: vi.fn().mockResolvedValue({ id: 7, name: 'P' }), get: vi.fn() as any });
        const svc = new PlayerService({} as any, mockQueries);
        const res = await svc.getPlayerState(7);
        expect((mockQueries.getPlayerState as any)).toHaveBeenCalledWith(7);
        expect(res).toEqual({ id: 7, name: 'P' });
    });

    it('falls back to queries.get when getPlayerState is missing', async () => {
        const mockQueries: IQueryService = makeQueryMock({ subscribe: vi.fn() as any, get: vi.fn().mockResolvedValue({ id: 8, name: 'Fallback' }) });
        const svc = new PlayerService({} as any, mockQueries);
        const res = await svc.getPlayerState(8);
        expect((mockQueries.get as any)).toHaveBeenCalledWith('playerState', 8);
        expect(res).toEqual({ id: 8, name: 'Fallback' });
    });

    it('setPlayerVoreRole delegates to commands', async () => {
        const mockCommands: ICommandService = makeCommandMock({ setPlayerVoreRole: vi.fn().mockResolvedValue('ok') });
        const svc = new PlayerService(mockCommands, makeQueryMock());
        await expect(svc.setPlayerVoreRole(1, 'Predator')).resolves.toEqual('ok');
        expect((mockCommands.setPlayerVoreRole as any)).toHaveBeenCalledWith(1, 'Predator');
    });

    it('subscribePlayerState returns unsubscribe that stops emission', () => {
        const handlers: any[] = [];
        const subscribeStub = vi.fn((topic, handler) => {
            handlers.push(handler);
            return () => {
                handlers.splice(handlers.indexOf(handler), 1);
            };
        });
        const mockQueries: IQueryService = makeQueryMock({ subscribe: subscribeStub as any, get: vi.fn() as any });
        const svc = new PlayerService({} as any, mockQueries);
        const called = vi.fn();
        const unsubscribe = svc.subscribePlayerState((s) => { });
        svc.on('playerState', called);

        // simulate event
        handlers.forEach(h => h({ id: 1 }));
        expect(called).toHaveBeenCalled();

        // call unsubscribe and simulate again
        unsubscribe();
        handlers.forEach(h => h({ id: 2 }));
        // should not be called again
        expect(called).toHaveBeenCalledTimes(1);
    });
});
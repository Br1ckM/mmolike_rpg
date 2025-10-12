import { describe, it, expect, vi } from 'vitest';
import { PlayerCommands } from '../../src/domains/player/commands/PlayerCommands';
import { PlayerQueries } from '../../src/domains/player/queries/PlayerQueries';
import type { ICommandService } from '../../src/services/CommandService';
import type { IQueryService } from '../../src/services/QueryService';

describe('PlayerCommands adapter', () => {
    it('delegates equipItem and supports legacy setVoreRole', async () => {
        const impl: ICommandService & any = {
            equipItem: vi.fn().mockResolvedValue('ok'),
            unequipItem: vi.fn() as any,
            useItemInBelt: vi.fn() as any,
            moveInventoryItem: vi.fn() as any,
            // legacy name present
            setVoreRole: vi.fn().mockResolvedValue('legacy'),
        };
        const adapter = new PlayerCommands(impl);
        await expect(adapter.equipItem(1, 2)).resolves.toEqual('ok');
        expect((impl.equipItem as any)).toHaveBeenCalledWith(1, 2);

        await expect(adapter.setPlayerVoreRole(1, 'Both')).resolves.toEqual('legacy');
        expect((impl.setVoreRole as any)).toHaveBeenCalledWith(1, 'Both');
    });

    it('returns resolved null when no implementation for setPlayerVoreRole exists', async () => {
        const impl: ICommandService = {
            equipItem: vi.fn().mockResolvedValue(true),
            unequipItem: vi.fn() as any,
            useItemInBelt: vi.fn() as any,
            moveInventoryItem: vi.fn() as any,
            // no setVoreRole / setPlayerVoreRole
        } as any;
        const adapter = new PlayerCommands(impl as any);
        await expect(adapter.setPlayerVoreRole(1, 'Neither')).resolves.toBeNull();
    });
});

describe('PlayerQueries adapter', () => {
    it('uses subscribe() when available and returns unsubscribe', () => {
        const handler = vi.fn();
        const subscribe = vi.fn((topic: string, h: Function) => {
            // simulate immediate invocation
            h({ ok: true });
            return () => {
                // noop unsubscribe
            };
        });
        const impl: IQueryService = { subscribe: subscribe as any, get: vi.fn() as any, getStaticContent: vi.fn() as any };
        const q = new PlayerQueries(impl);
        q.subscribe('playerState', handler);
        expect(subscribe).toHaveBeenCalledWith('playerState', expect.any(Function));
        expect(handler).toHaveBeenCalledWith({ ok: true });
    });

    it('falls back to EventEmitter style on/off and returns an unsubscribe that calls off', () => {
        const handler = vi.fn();
        const on = vi.fn((topic: string, h: Function) => {
            // call handler immediately to simulate event
            h({ e: 1 });
        });
        const off = vi.fn();
        const impl: any = { on, off };
        const q = new PlayerQueries(impl as any);
        const unsubscribe = q.subscribe('playerState', handler);
        expect(on).toHaveBeenCalledWith('playerState', expect.any(Function));
        expect(handler).toHaveBeenCalledWith({ e: 1 });

        // call returned unsubscribe and ensure off was called
        unsubscribe();
        expect(off).toHaveBeenCalledWith('playerState', expect.any(Function));
    });

    it('getPlayerState uses getPlayerState when available and falls back to get', async () => {
        const queriesWithDirect = {
            subscribe: vi.fn() as any,
            getPlayerState: vi.fn().mockResolvedValue({ id: 7 }),
            get: vi.fn() as any,
        } as unknown as IQueryService;
        const q1 = new PlayerQueries(queriesWithDirect);
        await expect(q1.getPlayerState(7)).resolves.toEqual({ id: 7 });
        expect((queriesWithDirect.getPlayerState as any)).toHaveBeenCalledWith(7);

        const queriesWithGet = {
            subscribe: vi.fn() as any,
            get: vi.fn().mockResolvedValue({ id: 8 }),
        } as unknown as IQueryService;
        const q2 = new PlayerQueries(queriesWithGet);
        await expect(q2.getPlayerState(8)).resolves.toEqual({ id: 8 });
        expect((queriesWithGet.get as any)).toHaveBeenCalledWith('playerState', 8);
    });
});
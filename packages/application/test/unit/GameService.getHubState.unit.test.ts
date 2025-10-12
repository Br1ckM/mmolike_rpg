import { describe, it, expect, beforeEach } from 'vitest';
import { GameService } from '../../src/services/GameService';
import getEntityDTO from '../../src/services/utils/getEntityDTO';

// Minimal helpers to create fake entities and world
function makeEntity(id: number, containerIds: string[] = []) {
    return { id, ContainerComponent: { containedEntityIds: containerIds } } as any;
}

function makeWorld(entities: any[]) {
    const map = new Map<number, any>();
    for (const e of entities) map.set(e.id, e);
    return { entities, getEntity: (id: number) => map.get(id) } as any;
}

describe('GameService.getHubState (unit)', () => {
    let svc: GameService;
    beforeEach(() => {
        svc = new GameService();
    });

    it('returns null if no player or player location', async () => {
        const res = await (svc as any).getHubState?.();
        expect(res).toBeNull();
    });

    it('returns hub DTO with npcs and nodes when present', async () => {
        // Create fake hub and zone entities and separate npc/node entities
        const hubEntity = makeEntity(101, ['npc_guard', 'npc_merchant']);
        const zoneEntity = makeEntity(201, ['node_1', 'node_2']);
        const npcGuard = makeEntity(103, []);
        const npcMerchant = makeEntity(104, []);
        const node1 = makeEntity(301, []);
        const node2 = makeEntity(302, []);

        // Create fake world and patch service (include all entities)
        (svc as any).world = makeWorld([hubEntity, zoneEntity, npcGuard, npcMerchant, node1, node2]);

        // contentIdToEntityIdMap must map content IDs (npc_/node_) to numeric entity IDs
        (svc as any).contentIdToEntityIdMap = new Map([
            ['npc_guard', 103],
            ['npc_merchant', 104],
            ['node_1', 301],
            ['node_2', 302],
        ]);

        // Create a fake player entity with PlayerLocationComponent data
        const playerEntity = { id: 1 } as any;
        const PlayerLocationComponent = { oneFrom: () => ({ data: { currentZoneId: String(201), currentSubLocationId: String(101) } }) };

        (svc as any).player = playerEntity;

        // Provide a ContainerComponent accessor so getEntityDTO extracts containedEntityIds
        const ContainerComponent = { oneFrom: (e: any) => e && e.ContainerComponent ? { data: e.ContainerComponent } : null };

        // Inject test modules so getHubState picks up PlayerLocationComponent and ContainerComponent
        (svc as any)._testModules = {
            world: { PlayerLocationComponent, ContainerComponent },
            npc: {},
        };

        const res = await (svc as any).getHubState?.();
        expect(res).not.toBeNull();
        expect(res.zoneId).toEqual(String(201));
        expect(res.location).toBeTruthy();
        expect(Array.isArray(res.npcs)).toBe(true);
        expect(Array.isArray(res.nodes)).toBe(true);

        // Detailed shape checks for NPC entries
        expect(res.npcs.length).toBeGreaterThanOrEqual(1);
        for (const npc of res.npcs) {
            expect(npc).toHaveProperty('id');
        }

        // Nodes are returned as DTOs as well
        expect(res.nodes.length).toBeGreaterThanOrEqual(1);
        for (const node of res.nodes) {
            expect(node).toHaveProperty('id');
        }
    });

    it('filters out entries when contentId mapping is missing and ignores non-npc entries', async () => {
        const hubEntity = makeEntity(102, ['npc_unknown', 'item_chest', 'npc_present']);
        const zoneEntity = makeEntity(202, ['node_missing', 'node_present']);

        // present mapped entities
        const presentNpcEntity = makeEntity(103, []);
        const presentNodeEntity = makeEntity(204, []);

        (svc as any).world = makeWorld([hubEntity, zoneEntity, presentNpcEntity, presentNodeEntity]);
        (svc as any).contentIdToEntityIdMap = new Map([
            ['npc_present', 103],
            ['node_present', 204],
        ]);

        const playerEntity = { id: 2 } as any;
        const PlayerLocationComponent = { oneFrom: () => ({ data: { currentZoneId: String(202), currentSubLocationId: String(102) } }) };
        (svc as any).player = playerEntity;

        const ContainerComponent = { oneFrom: (e: any) => e && e.ContainerComponent ? { data: e.ContainerComponent } : null };
        (svc as any)._testModules = { world: { PlayerLocationComponent, ContainerComponent }, npc: {} };

        const res = await (svc as any).getHubState?.();
        expect(res).not.toBeNull();
        // npc_unknown should be filtered (missing mapping), item_chest ignored, npc_present included
        expect(res.npcs.some((n: any) => n && n.id === 103)).toBe(true);
        // node_missing filtered, node_present included
        expect(res.nodes.some((n: any) => n && n.id === 204)).toBe(true);
    });
});

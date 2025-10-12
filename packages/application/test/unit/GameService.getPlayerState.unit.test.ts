import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameService } from '../../src/services/GameService';
import getEntityDTO from '../../src/services/utils/getEntityDTO';

// Lightweight mocked component accessors and a fake world to simulate the ECS
function makeInfoComponent(name: string) {
    return {
        oneFrom: (entity: any) => ({ data: { name, ancestryId: 'human' } })
    };
}

function makeHealthComponent(hp: number) {
    return {
        oneFrom: (entity: any) => ({ data: { current: hp, max: hp } })
    };
}

function makeInventoryComponent(walletId: number, bagIds: string[] = []) {
    return {
        oneFrom: (entity: any) => ({ data: { walletId: String(walletId), bagIds } })
    };
}

function makeItemEntity(id: number, name: string) {
    return {
        id, get: () => null, // some ECS shapes
        // We'll pretend getEntityDTO will only call accessor.oneFrom on provided accessors
    };
}

// Build a fake world with simple getEntity and entities list
function makeWorld(entities: any[]) {
    const map = new Map<number, any>();
    for (const e of entities) map.set(e.id, e);
    return {
        entities,
        getEntity: (id: number) => map.get(id),
    };
}

describe('GameService.getPlayerState (unit)', () => {
    let svc: GameService;

    beforeEach(() => {
        svc = new GameService();
    });

    it('returns null when no world/player present', async () => {
        const res = await (svc as any).getPlayerState?.(1);
        expect(res).toBeNull();
    });

    it('builds a basic player DTO when world and player exist', async () => {
        // Create a fake player entity matching the expected shape
        const playerEntity = { id: 10 } as any;

        // Patch the GameService instance with a fake world and minimal component modules
        (svc as any).world = makeWorld([playerEntity]);
        (svc as any).player = playerEntity;
        // Mock the content map to return simple ancestry stat modifiers
        (svc as any).content = { ancestries: new Map([['human', { statModifiers: { strength: 1, dexterity: 2, intelligence: 3 } }]]) };
        // Provide a minimal contentIdToEntityIdMap used by quests/skills logic
        (svc as any).contentIdToEntityIdMap = new Map();

        // Monkeypatch require() to return our fake component modules when invoked inside getPlayerState
        const originalRequire = (module as any).require ?? require;
        const fakeCharComps = {
            InfoComponent: makeInfoComponent('Hero'),
            HealthComponent: makeHealthComponent(42),
            ControllableComponent: { oneFrom: () => null },
            CoreStatsComponent: { oneFrom: (e: any) => ({ data: { strength: 5, dexterity: 5, intelligence: 5 } }) },
            DerivedStatsComponent: { oneFrom: () => ({ data: {} }) },
            ManaComponent: { oneFrom: () => ({ data: { current: 10, max: 10 } }) },
            SkillBookComponent: { oneFrom: () => ({ data: { knownSkills: [] } }) },
            DialogueComponent: { oneFrom: () => null },
            VendorComponent: { oneFrom: () => null },
            TrainerComponent: { oneFrom: () => null },
            ConsumableBeltComponent: { oneFrom: () => null },
            ProgressionComponent: { oneFrom: () => null },
            AppearanceComponent: { oneFrom: () => null },
            VoreRoleComponent: { oneFrom: () => null },
            VoreComponent: { oneFrom: () => null },
            CompanionComponent: { oneFrom: () => null },
            InventoryComponent: makeInventoryComponent(20, []),
            EquipmentComponent: { oneFrom: () => ({ data: {} }) },
        };

        const fakeItemComps = {
            SlotsComponent: { oneFrom: () => ({ data: { items: [] } }) },
            ItemInfoComponent: { oneFrom: () => null },
            StackableComponent: { oneFrom: () => null },
            EquipableComponent: { oneFrom: () => null },
            AffixesComponent: { oneFrom: () => null },
            ModsComponent: { oneFrom: () => null },
            ModSlotsComponent: { oneFrom: () => null },
            CurrencyComponent: { oneFrom: () => ({ data: { copper: 100 } }) },
        };

        const fakeQuestComps = {
            QuestStatusComponent: { allFrom: () => [] },
            QuestComponent: { oneFrom: () => null },
            QuestObjectiveComponent: { oneFrom: () => null },
        };

        const fakeSkillComps = {
            SkillInfoComponent: { oneFrom: () => null },
            SkillComponent: { oneFrom: () => null },
            ProgressionComponent: { oneFrom: () => null },
        };

        // Inject test modules directly on the service instance so the guarded port uses them
        (svc as any)._testModules = {
            character: fakeCharComps,
            item: fakeItemComps,
            quest: fakeQuestComps,
            skill: fakeSkillComps,
        };

        const result = await (svc as any).getPlayerState?.(10);
        expect(result).not.toBeNull();
        expect(result.id).toEqual(10);
        expect(result.name).toEqual('Hero');
        expect(result.health).toBeTruthy();
        expect(result.inventory).toBeTruthy();
        expect(result.coreStats).toBeTruthy();
        expect(result.ancestry).toBeTruthy();
    });
});

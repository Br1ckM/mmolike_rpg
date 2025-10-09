import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupSystemTest } from '../harness/setup';
import { PartySystem } from '../../ecs/systems/PartySystem';
import { CompanionComponent } from '../../ecs/components/npc';
import { ContainerComponent } from '../../ecs/components/world';
import { NPCEntityData } from '../../ecs/entities/npc';

// Mock data for our test NPCs and Location
const LENNA_ID = 'npc_lenna_herbalist';
const KAELAN_ID = 'npc_kaelan_ranger';
const VILLAGE_ID = 'loc_cloverfell_village';

const lennaData: NPCEntityData = {
    info: { name: 'Lenna', race: 'Human', avatarUrl: '' },
    schedule: { currentLocationId: VILLAGE_ID, defaultSchedule: [], questOverrides: [] },
    companion: { recruited: false, inActiveParty: false, affinity: 0, campDialogueTreeId: '' },
};

const kaelanData: NPCEntityData = {
    info: { name: 'Kaelan', race: 'Elf', avatarUrl: '' },
    schedule: { currentLocationId: VILLAGE_ID, defaultSchedule: [], questOverrides: [] },
    companion: { recruited: false, inActiveParty: false, affinity: 0, campDialogueTreeId: '' },
};

const villageData = {
    location: { name: 'Cloverfell', description: '', type: 'Hub', isSafeZone: true },
    container: { containedEntityIds: [LENNA_ID, KAELAN_ID] },
} as any;


describe('PartySystem', () => {
    let harness: ReturnType<typeof setupSystemTest>;

    beforeEach(() => {
        harness = setupSystemTest();
    });

    it('should remove a companion from their location upon recruitment', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc, createLocation } = harness;
        const lenna = createNpc(LENNA_ID, lennaData);
        const village = createLocation(VILLAGE_ID, villageData);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        partySystem['onCompanionRecruited']({ characterId: player.id, npcId: lenna.id });

        const villageContainer = ContainerComponent.oneFrom(village)!.data;
        expect(villageContainer.containedEntityIds).not.toContain(LENNA_ID);
        expect(mockEventBus.emit).toHaveBeenCalledWith('partyUpdated', { characterId: player.id });
    });

    it('should add a recruited companion to the active party if there is space', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc } = harness;
        const lenna = createNpc(LENNA_ID, lennaData);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        partySystem['onCompanionRecruited']({ characterId: player.id, npcId: lenna.id });

        const companionComp = CompanionComponent.oneFrom(lenna)!.data;
        expect(companionComp.recruited).toBe(true);
        expect(companionComp.inActiveParty).toBe(true);
    });

    it('should NOT add a companion to a full party upon recruitment', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc } = harness;
        // 1. Setup a party that is already full (Player + 3 others)
        for (let i = 0; i < 3; i++) {
            createNpc(`npc_filler_${i}`, {
                info: { name: `Filler ${i}`, race: 'Human', avatarUrl: '' },
                companion: { recruited: true, inActiveParty: true, affinity: 0, campDialogueTreeId: '' },
            } as any);
        }
        const kaelan = createNpc(KAELAN_ID, kaelanData);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        // 2. Act: Recruit a new companion (Kaelan)
        partySystem['onCompanionRecruited']({ characterId: player.id, npcId: kaelan.id });

        // 3. Assert
        const companionComp = CompanionComponent.oneFrom(kaelan)!.data;
        expect(companionComp.recruited).toBe(true); // Should still be recruited
        expect(companionComp.inActiveParty).toBe(false); // Should NOT be in the active party
    });

    it('should emit a notification when trying to add a companion to a full party', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc } = harness;
        for (let i = 0; i < 3; i++) {
            createNpc(`npc_filler_${i}`, {
                info: { name: `Filler ${i}`, race: 'Human', avatarUrl: '' },
                companion: { recruited: true, inActiveParty: true, affinity: 0, campDialogueTreeId: '' },
            } as any);
        }
        const kaelan = createNpc(KAELAN_ID, kaelanData);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        partySystem['onSwapCompanion']({ characterId: player.id, companionId: kaelan.id });

        expect(mockEventBus.emit).toHaveBeenCalledWith('notification', { type: 'warn', message: 'Your party is full.' });
    });

    it('should remove an active companion from the party when swapped', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc } = harness;
        const lenna = createNpc(LENNA_ID, {
            ...lennaData,
            companion: { recruited: true, inActiveParty: true, affinity: 0, campDialogueTreeId: '' },
        } as any);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        partySystem['onSwapCompanion']({ characterId: player.id, companionId: lenna.id });

        const companionComp = CompanionComponent.oneFrom(lenna)!.data;
        expect(companionComp.inActiveParty).toBe(false);
        expect(mockEventBus.emit).toHaveBeenCalledWith('partyUpdated', { characterId: player.id });
    });

    it('should add a benched companion to the active party when swapped', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc } = harness;
        const lenna = createNpc(LENNA_ID, {
            ...lennaData,
            companion: { recruited: true, inActiveParty: false, affinity: 0, campDialogueTreeId: '' },
        } as any);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        partySystem['onSwapCompanion']({ characterId: player.id, companionId: lenna.id });

        const companionComp = CompanionComponent.oneFrom(lenna)!.data;
        expect(companionComp.inActiveParty).toBe(true);
        expect(mockEventBus.emit).toHaveBeenCalledWith('partyUpdated', { characterId: player.id });
    });

    it('should do nothing if a companion is recruited more than once', () => {
        const { world, mockEventBus, mockContentIdToEntityIdMap, player, createNpc, createLocation } = harness;
        const lenna = createNpc(LENNA_ID, lennaData);
        createLocation(VILLAGE_ID, villageData);
        const partySystem = new PartySystem(world, mockEventBus, mockContentIdToEntityIdMap);

        // First recruitment
        partySystem['onCompanionRecruited']({ characterId: player.id, npcId: lenna.id });
        const callCount = mockEventBus.emit.mock.calls.length;

        // Second (duplicate) recruitment attempt
        partySystem['onCompanionRecruited']({ characterId: player.id, npcId: lenna.id });

        // Assert that no new events were emitted
        expect(mockEventBus.emit.mock.calls.length).toBe(callCount);
    });
});
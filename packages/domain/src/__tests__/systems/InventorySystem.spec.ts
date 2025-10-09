import { describe, it, expect, beforeEach } from 'vitest';
import { setupSystemTest } from '../harness/setup';
import { InventorySystem } from '../../../src/ecs/systems/InventorySystem';
import {
    SlotsComponent,
    StackableComponent,
} from '../../../src/ecs/components/item';
import { InventoryComponent } from '../../../src/ecs/components/character';
import { Character } from '../../../src/ecs/entities/character';
import { Item } from '../../../src/ecs/entities/item';
import { Entity } from 'ecs-lib';

describe('InventorySystem', () => {
    let harness: ReturnType<typeof setupSystemTest>;
    let player: Character;
    let inventorySystem: InventorySystem;
    let bag: Item;

    beforeEach(() => {
        harness = setupSystemTest();
        player = harness.player;
        inventorySystem = new InventorySystem(harness.world, harness.mockEventBus);

        // --- CORE FIX ---
        // Create a bag with its slots array properly initialized to its size with nulls.
        const bagSize = 16;
        bag = new Item({ info: { name: 'bag', description: 'A bag', itemType: 'misc', rarity: 'Common' } });
        bag.add(new SlotsComponent({ size: bagSize, items: Array(bagSize).fill(null) }));
        harness.world.addEntity(bag);

        player.add(new InventoryComponent({ bagIds: [String(bag.id)], walletId: 'wallet_1' }));
    });

    // Helper to create items
    const createTestItem = (id: string, isStackable: boolean, stackSize: number = 1): Item => {
        const { world } = harness;
        const item = new Item({
            info: { name: id, description: 'desc', itemType: 'misc', rarity: 'Common' }
        });
        if (isStackable) {
            item.add(new StackableComponent({ maxStack: 10, current: stackSize }));
        }
        world.addEntity(item);
        return item;
    };

    describe('Adding Items to Inventory', () => {
        it('should add a single item to an inventory', () => {
            const sword = createTestItem('item_sword', false);
            inventorySystem['handleAddItem']({ characterId: player.id, itemEntityId: sword.id, baseItemId: 'item_sword' });

            const bagSlots = SlotsComponent.oneFrom(bag)!;
            expect(bagSlots.data.items[0]).toBe(String(sword.id));
        });

        it('should add a second item to a different slot', () => {
            const sword = createTestItem('item_sword', false);
            SlotsComponent.oneFrom(bag)!.data.items[0] = String(sword.id);

            const shield = createTestItem('item_shield', false);
            inventorySystem['handleAddItem']({ characterId: player.id, itemEntityId: shield.id, baseItemId: 'item_shield' });

            const bagSlots = SlotsComponent.oneFrom(bag)!;
            expect(bagSlots.data.items[1]).toBe(String(shield.id));
        });

        it('should stack a stackable item', () => {
            const { world } = harness;
            const existingPotion = createTestItem('item_potion', true, 5);
            SlotsComponent.oneFrom(bag)!.data.items[0] = String(existingPotion.id);

            const newPotion = createTestItem('item_potion', true, 1);
            inventorySystem['handleAddItem']({ characterId: player.id, itemEntityId: newPotion.id, baseItemId: 'item_potion' });

            const stack = StackableComponent.oneFrom(existingPotion)!;
            expect(stack.data.current).toBe(6);
            expect(world.getEntity(newPotion.id)).toBeUndefined();
        });

        it('should create a new stack if the existing one is full', () => {
            const fullStackPotion = createTestItem('item_potion', true, 10);
            SlotsComponent.oneFrom(bag)!.data.items[0] = String(fullStackPotion.id);

            const newPotion = createTestItem('item_potion', true, 1);
            inventorySystem['handleAddItem']({ characterId: player.id, itemEntityId: newPotion.id, baseItemId: 'item_potion' });

            const bagSlots = SlotsComponent.oneFrom(bag)!;
            expect(bagSlots.data.items[1]).toBe(String(newPotion.id));
        });

        it('should not add an item to a full inventory', () => {
            const { mockEventBus } = harness;
            const bagSlots = SlotsComponent.oneFrom(bag)!;
            bagSlots.data.size = 2;
            bagSlots.data.items = [String(createTestItem('item_1', false).id), String(createTestItem('item_2', false).id)];

            const extraItem = createTestItem('item_extra', false);
            inventorySystem['handleAddItem']({ characterId: player.id, itemEntityId: extraItem.id, baseItemId: 'item_extra' });

            expect(mockEventBus.emit).toHaveBeenCalledWith('inventoryFull', {
                characterId: player.id,
                itemEntityId: extraItem.id
            });
        });
    });
    it('should add an item to the second bag if the first one is full', () => {
        const { world } = harness;

        // SETUP: Create a second bag and add it to the player's inventory
        const secondBag = new Item({ info: { name: 'second_bag', description: 'Another bag', itemType: 'misc', rarity: 'Common' } });
        const secondBagSize = 8;
        secondBag.add(new SlotsComponent({ size: secondBagSize, items: Array(secondBagSize).fill(null) }));
        world.addEntity(secondBag);

        // FIX: Use oneFrom to access the component data
        InventoryComponent.oneFrom(player)!.data.bagIds.push(String(secondBag.id));

        // Fill the first bag completely
        const firstBagSlots = SlotsComponent.oneFrom(bag)!;
        firstBagSlots.data.size = 1;
        firstBagSlots.data.items = [String(createTestItem('full_item', false).id)];

        // ACT: Add a new item that should go into the second bag
        const newItem = createTestItem('new_item', false);
        inventorySystem['handleAddItem']({ characterId: player.id, itemEntityId: newItem.id, baseItemId: 'new_item' });

        // ASSERT: The second bag should contain the new item
        const secondBagSlots = SlotsComponent.oneFrom(secondBag)!;
        expect(secondBagSlots.data.items[0]).toBe(String(newItem.id));
    });

    describe('Removing Items from Inventory', () => {
        it('should remove a single item', () => {
            const sword = createTestItem('item_sword', false);
            const bagSlots = SlotsComponent.oneFrom(bag)!;
            bagSlots.data.items[0] = String(sword.id);

            inventorySystem['handleRemoveItem']({ characterId: player.id, itemEntityId: sword.id, quantity: 1, reason: 'drop' });

            expect(bagSlots.data.items[0]).toBeNull();
        });

        it('should remove a specified quantity from a stack', () => {
            const potionStack = createTestItem('item_potion', true, 8);
            SlotsComponent.oneFrom(bag)!.data.items[0] = String(potionStack.id);

            // ACT: Remove 3 potions from the stack of 8
            inventorySystem['handleRemoveItem']({ characterId: player.id, itemEntityId: potionStack.id, quantity: 3, reason: 'consume' });

            // ASSERT: The item is still in the slot, but its stack count is reduced
            const stack = StackableComponent.oneFrom(potionStack)!;
            expect(SlotsComponent.oneFrom(bag)!.data.items[0]).toBe(String(potionStack.id));
            expect(stack.data.current).toBe(5);
        });

        it('should remove an entire stack when the last item is removed', () => {
            const potionStack = createTestItem('item_potion', true, 1);
            SlotsComponent.oneFrom(bag)!.data.items[0] = String(potionStack.id);

            inventorySystem['handleRemoveItem']({ characterId: player.id, itemEntityId: potionStack.id, quantity: 1, reason: 'consume' });

            expect(SlotsComponent.oneFrom(bag)!.data.items[0]).toBeNull();
        });

        it('should not remove an item that does not exist', () => {
            const sword = createTestItem('item_sword', false);
            const nonExistentItem = createTestItem('item_ghost', false);
            const bagSlots = SlotsComponent.oneFrom(bag)!;
            bagSlots.data.items[0] = String(sword.id);

            inventorySystem['handleRemoveItem']({ characterId: player.id, itemEntityId: nonExistentItem.id, quantity: 1, reason: 'drop' });

            expect(bagSlots.data.items[0]).toBe(String(sword.id));
        });
    });

    describe('Equipping and Unequipping Items', () => {
        it('should remove an item from the bag but not destroy it when equipping', () => {
            const { world, mockEventBus } = harness;
            const sword = createTestItem('item_sword', false);
            SlotsComponent.oneFrom(bag)!.data.items[0] = String(sword.id);

            // ACT: Another system requests to remove the item for equipping
            inventorySystem['handleRemoveItem']({ characterId: player.id, itemEntityId: sword.id, quantity: 1, reason: 'equip' });

            // ASSERT: The item is gone from the bag
            expect(SlotsComponent.oneFrom(bag)!.data.items[0]).toBeNull();

            // ASSERT: The system emitted the correct event for the EquipmentSystem to pick up
            expect(mockEventBus.emit).toHaveBeenCalledWith('itemRemovedForEquip', {
                characterId: player.id,
                itemEntityId: sword.id,
            });

            // ASSERT: The item entity itself STILL EXISTS in the world
            expect(world.getEntity(sword.id)).toBeDefined();
        });
    });
});
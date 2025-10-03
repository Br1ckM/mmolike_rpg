// src/stores/inventory.ts (Modified)

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Define core item properties
export interface Item {
    id: number;
    name: string;
    icon: string;
    type: 'gear' | 'consumable' | 'resource';
    stackSize: number;
    maxStack: number;
    quality: 'Common' | 'Uncommon' | 'Rare';
}

export interface Bag {
    id: number;
    name: string;
    slots: number;
    items: (Item | null)[];
}

export const useInventoryStore = defineStore('inventory', () => {
    // --- State ---

    // Currencies (The Wallet)
    const wallet = ref({
        Gold: 500,
        Silver: 12,
        Gems: 5,
    });

    // Consumables quick slots (The Belt)
    // Belt is a fixed array of 5 slots
    const belt = ref<(Item | null)[]>([
        { id: 10, name: 'Health Potion', icon: 'pi pi-plus-circle', type: 'consumable', stackSize: 5, maxStack: 10, quality: 'Common' },
        null,
        null,
        null,
        null,
    ]);

    // Inventory Bags (The main storage)
    const bags = ref<Bag[]>([
        {
            id: 1,
            name: 'Primary Bag',
            slots: 20,
            items: [
                { id: 100, name: 'Iron Ore', icon: 'pi pi-box', type: 'resource', stackSize: 15, maxStack: 50, quality: 'Common' },
                {
                    id: 101,
                    name: 'Shadowbane Longsword',
                    icon: 'pi pi-bolt',
                    type: 'gear',
                    stackSize: 1,
                    maxStack: 1,
                    quality: 'Epic',
                    itemLevel: 42,
                    baseStats: { Damage: '50 - 75', Speed: '1.2/s' },
                    affixes: ['+12 STR', '+10% Crit Damage'],
                    modSlots: ['filled', 'empty', 'empty', 'filled'], // 4 mod slots
                },
                null,
                { id: 102, name: 'Mana Potion', icon: 'pi pi-star-fill', type: 'consumable', stackSize: 3, maxStack: 10, quality: 'Uncommon' },
                // 16 empty slots follow...
                ...Array(16).fill(null),
            ],
        },
        {
            id: 2,
            name: 'Secondary Bag', // Renamed for clarity
            slots: 10,
            items: [
                { id: 200, name: 'Silk Cloth', icon: 'pi pi-tag', type: 'resource', stackSize: 22, maxStack: 99, quality: 'Uncommon' },
                null,
                { id: 201, name: 'Ring Mold', icon: 'pi pi-circle', type: 'resource', stackSize: 1, maxStack: 5, quality: 'Rare' },
                ...Array(7).fill(null),
            ],
        },
        {
            id: 3,
            name: 'Utility Pouch', // NEW BAG ADDED
            slots: 6, // Smaller size
            items: [
                { id: 300, name: 'Copper Coin', icon: 'pi pi-dollar', type: 'resource', stackSize: 5, maxStack: 100, quality: 'Common' },
                ...Array(5).fill(null),
            ],
        },
    ]);

    // --- Getters ---
    // Recalculated based on the new bags state
    const totalSlots = bags.value.reduce((sum, bag) => sum + bag.slots, 0);
    const usedSlots = bags.value.reduce((sum, bag) => sum + bag.items.filter(item => item !== null).length, 0);

    // --- Actions ---
    function useConsumable(slotIndex: number) {
        const item = belt.value[slotIndex];
        if (item && item.type === 'consumable') {
            item.stackSize--;
            if (item.stackSize <= 0) {
                belt.value[slotIndex] = null;
            }
            console.log(`Used 1 ${item.name}`);
        }
    }

    // --- Modal State ---
    const itemToInspect = ref<Item | null>(null);
    const isInspectorOpen = computed(() => itemToInspect.value !== null);

    // --- Actions ---
    function inspectItem(item: Item | null) {
        // This is the ONLY place that controls the modal visibility
        itemToInspect.value = item;
    }

    function closeInspector() {
        itemToInspect.value = null;
    }

    return {
        wallet,
        belt,
        bags,
        totalSlots,
        usedSlots,
        useConsumable,
        inspectItem,
        closeInspector,
        isInspectorOpen
    };
});
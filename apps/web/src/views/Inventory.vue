<script setup lang="ts">
import CharacterEquipmentPanel from '@/components/inventory/CharacterEquipmentPanel.vue';
import InventoryBags from '@/components/inventory/InventoryBags.vue';
import InventoryBelt from '@/components/inventory/InventoryBelt.vue';
import InventoryWallet from '@/components/inventory/InventoryWallet.vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import Button from '@/volt/Button.vue';

const playerStore = usePlayerStore();
const { inventorySortBy, inventoryFilterText } = storeToRefs(playerStore);

const onFilterChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    playerStore.setInventoryFilter(target.value);
};
</script>

<template>
    <div class="h-full flex flex-col p-4 md:p-8 bg-surface-800 text-surface-0">
        <header class="flex-shrink-0 mb-6">
            <h1 class="text-4xl font-bold text-primary-400">Inventory</h1>
            <p class="text-surface-400">Manage your items, equipment, and consumables.</p>
        </header>

        <div class="flex-grow grid grid-cols-12 gap-6">
            <!-- Main Content -->
            <div class="col-span-12 lg:col-span-8 flex flex-col gap-6 overflow-y-auto">
                <!-- Sort and Filter Controls -->
                <div class="flex-shrink-0 bg-surface-900 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
                    <div class="relative flex-grow w-full md:w-auto">
                        <i class="pi pi-search absolute top-1/2 -translate-y-1/2 left-3 text-surface-400"></i>
                        <input type="text" placeholder="Search by name or type..."
                            class="bg-surface-800 border border-surface-700 rounded-md w-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            @input="onFilterChange" :value="inventoryFilterText" />
                    </div>
                    <div class="flex gap-2 flex-wrap justify-center">
                        <Button :label="'Sort: Name'" :severity="inventorySortBy === 'name' ? 'primary' : 'secondary'"
                            @click="playerStore.setInventorySort('name')" />
                        <Button :label="'Sort: Type'" :severity="inventorySortBy === 'type' ? 'primary' : 'secondary'"
                            @click="playerStore.setInventorySort('type')" />
                        <Button :label="'Sort: Rarity'"
                            :severity="inventorySortBy === 'rarity' ? 'primary' : 'secondary'"
                            @click="playerStore.setInventorySort('rarity')" />
                        <Button icon="pi pi-times" severity="danger" @click="playerStore.clearInventorySortAndFilter()"
                            v-if="inventorySortBy !== 'default' || inventoryFilterText" />
                    </div>
                </div>

                <InventoryBags />
                <InventoryBelt />
            </div>

            <!-- Side Panel -->
            <aside class="col-span-12 lg:col-span-4 hidden lg:flex lg:flex-col gap-6">
                <div class="bg-surface-900 rounded-lg p-6">
                    <h2 class="text-2xl font-bold text-primary-400 border-b border-surface-700 pb-2 mb-4">Equipment</h2>
                    <CharacterEquipmentPanel />
                </div>

                <InventoryWallet />
            </aside>
        </div>
    </div>
</template>
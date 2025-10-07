<script setup lang="ts">
import { usePlayerStore, type UIItem } from '@/stores/player';
import { storeToRefs } from 'pinia';
import InventoryItemSlot from '../inventory/InventoryItemSlot.vue';

const playerStore = usePlayerStore();
const { belt } = storeToRefs(playerStore);

const emit = defineEmits(['select-item']);

function selectItem(item: UIItem | null, index: number) {
    if (item) {
        emit('select-item', { item, index });
    }
}
</script>

<template>
    <div class="bg-surface-800 p-4 rounded-lg shadow-xl border border-primary-500">
        <p class="text-lg font-bold text-primary-400 text-center mb-4">Select an Item</p>
        <div class="grid grid-cols-5 gap-2">
            <div v-for="(item, index) in belt" :key="index" @click="selectItem(item, index)" class="relative">
                <InventoryItemSlot :item="item" />
                <span v-if="item"
                    class="absolute top-0 left-0 bg-surface-900/50 text-surface-300 text-[10px] px-1 rounded-br-md z-20">
                    {{ index + 1 }}
                </span>
            </div>
        </div>
    </div>
</template>
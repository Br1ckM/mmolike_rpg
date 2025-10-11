<script setup lang="ts">
import InventoryItemSlot from '@/components/inventory/InventoryItemSlot.vue';
import type { UIItem } from '@/stores/player';

defineProps<{
    slotName: string;
    item: UIItem | null;
}>();
</script>

<template>
    <div class="h-20 w-20 bg-surface-800 rounded-lg p-2 flex flex-col items-center justify-center text-center">
        <!-- If an item is equipped, use InventoryItemSlot -->
        <InventoryItemSlot v-if="item" :item="item" />

        <!-- Otherwise, show a placeholder -->
        <div v-else class="text-surface-600">
            <i class="pi pi-question-circle text-2xl"></i>
            <p class="text-xs mt-1 font-semibold">{{ slotName }}</p>
        </div>
    </div>
</template>
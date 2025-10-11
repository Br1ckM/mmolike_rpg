<script setup lang="ts">
import { computed, ref } from 'vue';
import type { UIItem } from '@/stores/player';

const props = defineProps<{
    item: UIItem | null;
    size?: 'default' | 'large';
}>();

// --- NEW: State and functions for the teleported tooltip ---
const tooltip = ref({
    visible: false,
    top: 0,
    left: 0
});

// A ref to get the position of the item slot element
const itemSlotRef = ref<HTMLElement | null>(null);

function showTooltip() {
    if (!props.item || !itemSlotRef.value) return;
    const rect = itemSlotRef.value.getBoundingClientRect();
    tooltip.value = {
        visible: true,
        // Position tooltip above the item, centered horizontally
        top: rect.top - 8, // 8px margin above the slot
        left: rect.left + rect.width / 2
    };
}

function hideTooltip() {
    tooltip.value.visible = false;
}

const qualityColorClasses = computed(() => {
    if (!props.item) return '';
    switch (props.item.quality) {
        case 'Junk': return 'border-surface-600 text-surface-400';
        case 'Common': return 'border-surface-400 text-surface-200';
        case 'Uncommon': return 'border-primary-400 text-primary-300';
        case 'Rare': return 'border-sky-400 text-sky-300';
        case 'Epic': return 'border-purple-400 text-purple-300';
        case 'Legendary': return 'border-yellow-400 text-yellow-300';
        default: return 'border-surface-500 text-surface-300';
    }
});
</script>

<template>
    <div ref="itemSlotRef" @mouseenter="showTooltip" @mouseleave="hideTooltip" :draggable="!!props.item" :class="[
        'w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center relative shadow-md transition-colors duration-150',
        props.item ? 'cursor-grab' : 'cursor-default',
        props.item
            ? qualityColorClasses
            : 'border-dashed border-surface-600 bg-surface-700/50 hover:border-surface-400'
    ]">
        <i v-if="props.item" :class="[props.item.icon, 'text-3xl', qualityColorClasses.split(' ')[1]]"></i>
        <i v-else class="pi pi-plus text-surface-600 text-2xl"></i>

        <span v-if="props.item?.stackSize && props.item.stackSize > 1"
            class="absolute bottom-0 right-0 bg-surface-900 text-surface-0 text-[10px] px-1 rounded-tl-md font-mono z-10">
            {{ props.item.stackSize }}
        </span>

    </div>

    <Teleport to="body">
        <div v-if="tooltip.visible && props.item"
            class="absolute transform -translate-x-1/2 -translate-y-full w-max max-w-xs z-50 pointer-events-none bg-surface-900 text-surface-200 text-xs rounded-md px-3 py-2 shadow-xl border"
            :class="[qualityColorClasses.split(' ')[0]]"
            :style="{ top: `${tooltip.top}px`, left: `${tooltip.left}px` }">

            <p class="font-bold text-sm" :class="qualityColorClasses.split(' ')[1]">{{ props.item.name }}</p>
            <p class="text-sm" :class="qualityColorClasses.split(' ')[1]">{{ props.item.quality }}</p>
            <div class="text-surface-300 mt-2 text-xs">
                <p v-if="props.item.type === 'equipment'">
                    Equipment <span class="text-surface-400 italic">({{ props.item.equipmentSlot }})</span>
                </p>
                <p v-else-if="props.item.maxStack && props.item.maxStack > 1">
                    Stack: {{ props.item.stackSize }} / {{ props.item.maxStack }}
                </p>
                <p v-else class="italic capitalize">
                    {{ props.item.type }}
                </p>
            </div>
        </div>
    </Teleport>
</template>
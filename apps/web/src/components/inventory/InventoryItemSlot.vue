<script setup lang="ts">
import { computed } from 'vue';
// --- FIX: Import the correct UIItem interface ---
import type { UIItem } from '@/stores/player';

// Define props to receive the item data
const props = defineProps<{
    item: UIItem | null;
    size?: 'default' | 'large';
}>();

// Helper function for quality colors
const qualityColorClasses = computed(() => {
    if (!props.item) return '';

    switch (props.item.quality) {
        case 'Uncommon': return 'border-sky-500 text-sky-400';
        case 'Rare': return 'border-purple-500 text-purple-400';
        default: return 'border-surface-500 text-surface-300';
    }
});
</script>

<template>
    <div :draggable="!!props.item" :class="[
        'w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center relative shadow-md transition-colors duration-150 group',
        props.item ? 'cursor-grab' : 'cursor-default',
        props.item
            ? qualityColorClasses
            : 'border-dashed border-surface-600 bg-surface-700/50 hover:border-surface-400'
    ]">
        <i v-if="props.item" :class="[props.item.icon, 'text-3xl', qualityColorClasses]"></i>
        <i v-else class="pi pi-plus text-surface-600 text-2xl"></i>

        <span v-if="props.item?.stackSize && props.item.stackSize > 1"
            class="absolute bottom-0 right-0 bg-surface-900 text-surface-0 text-[10px] px-1 rounded-tl-md font-mono z-10">
            {{ props.item.stackSize }}
        </span>

        <div v-if="props.item" class="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-max max-w-xs z-20 transform -translate-x-1/2
                   bg-surface-900 text-surface-200 text-xs rounded-md px-3 py-2 shadow-xl border"
            :class="[props.item.quality === 'Rare' ? 'border-purple-500' : 'border-surface-600']">
            <p class="font-bold text-sm" :class="qualityColorClasses">{{ props.item.name }}</p>
            <p class="text-surface-400 mt-1 italic capitalize">{{ props.item.type }}</p>

            <p v-if="props.item.type !== 'gear'" class="text-surface-300 mt-1">Stack: {{ props.item.stackSize }}/{{
                props.item.maxStack }}</p>

            <p v-if="props.item.type === 'gear'" class="text-surface-300 mt-1">Lvl 1 - {{ props.item.quality }}</p>
        </div>

        <slot name="tooltip-info"></slot>
    </div>
</template>
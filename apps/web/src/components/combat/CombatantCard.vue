<script setup lang="ts">
import { computed } from 'vue';
import Avatar from '@/volt/Avatar.vue';

const props = defineProps<{
    combatant: any;
    isActive: boolean;
    isTargetable?: boolean;
    isTargeted?: boolean;
}>();

const healthPercentage = computed(() => {
    if (!props.combatant?.HealthComponent) return 0;
    const { current, max } = props.combatant.HealthComponent;
    return max > 0 ? (current / max) * 100 : 0;
});
</script>

<template>
    <div 
        class="relative group w-20 h-24 bg-surface-800 rounded-lg p-2 flex flex-col items-center justify-between border-2 border-surface-700 shadow-lg transition-all duration-200"
        :class="{ 
            'is-active-turn': isActive,
            'cursor-pointer hover:border-red-500 hover:scale-110': isTargetable,
            '!border-red-500 border-4 scale-110': isTargeted
        }"
    >
        <Avatar :image="combatant.InfoComponent.avatarUrl" size="large" shape="square" />
        <div class="w-full bg-black/50 rounded-full h-2 border border-surface-900 overflow-hidden">
            <div
                class="h-full bg-green-500 transition-all duration-300"
                :style="{ width: `${healthPercentage}%` }"
            ></div>
        </div>
        
        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max z-20 bg-surface-900 text-surface-50 text-xs rounded-md px-2 py-1 shadow-xl border border-surface-600">
            <p class="font-bold text-base text-primary-400">{{ combatant.InfoComponent.name }}</p>
            <p class="text-surface-300 font-mono">HP: {{ combatant.HealthComponent.current }} / {{ combatant.HealthComponent.max }}</p>
        </div>
    </div>
</template>
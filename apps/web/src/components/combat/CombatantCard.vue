<script setup lang="ts">
import { computed } from 'vue';
import Avatar from '@/volt/Avatar.vue';

const props = defineProps<{
    combatant: any;
    isActive: boolean;
    isTargetable?: boolean;
    isTargeted?: boolean;
    combatLog: any[];
}>();

const healthPercentage = computed(() => {
    if (!props.combatant?.HealthComponent) return 0;
    const { current, max } = props.combatant.HealthComponent;
    return max > 0 ? (current / max) * 100 : 0;
});

// --- START: New computed property to check for death ---
const isDead = computed(() => props.combatant?.HealthComponent?.current <= 0);
// --- END: New computed property ---

const floatingTexts = computed(() => {
    return props.combatLog.filter(event => event.targetId === String(props.combatant.id));
});

const getTextColor = (type: string) => {
    switch (type) {
        case 'heal': return 'text-green-400';
        case 'crit': return 'text-yellow-400 font-black text-2xl';
        default: return 'text-red-400';
    }
}

</script>

<template>
    <div class="relative group w-20 h-24 bg-surface-800 rounded-lg p-2 flex flex-col items-center justify-between border-2 border-surface-700 shadow-lg transition-all duration-200"
        :class="{
            'is-active-turn': isActive && !isDead,
            'cursor-pointer hover:border-red-500 hover:scale-110': isTargetable && !isDead,
            '!border-red-500 border-4 scale-110': isTargeted && !isDead,
            'opacity-50': isDead
        }">
        <div class="absolute inset-0 pointer-events-none z-20">
            <TransitionGroup name="float-up">
                <div v-for="event in floatingTexts" :key="event.id"
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-xl"
                    :class="getTextColor(event.type)">
                    {{ event.type === 'heal' ? '+' : '-' }}{{ Math.round(event.amount) }}
                </div>
            </TransitionGroup>
        </div>

        <div v-if="isDead" class="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center z-10">
            <i class="pi pi-times text-red-500 text-5xl" style="text-shadow: 0 0 5px black;"></i>
        </div>
        <Avatar :image="combatant.InfoComponent.avatarUrl" size="large" shape="square" />
        <div class="w-full bg-black/50 rounded-full h-2 border border-surface-900 overflow-hidden">
            <div class="h-full bg-green-500 transition-all duration-300" :style="{ width: `${healthPercentage}%` }">
            </div>
        </div>

        <div
            class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max z-20 bg-surface-900 text-surface-50 text-xs rounded-md px-2 py-1 shadow-xl border border-surface-600">
            <p class="font-bold text-base text-primary-400">{{ combatant.InfoComponent.name }}</p>
            <p class="text-surface-300 font-mono">HP: {{ combatant.HealthComponent.current }} / {{
                combatant.HealthComponent.max }}</p>
        </div>
    </div>
</template>

<style scoped>
.float-up-enter-active,
.float-up-leave-active {
    transition: all 1.5s ease-out;
}

.float-up-enter-from {
    opacity: 1;
    transform: translate(-50%, -50%);
}

.float-up-leave-to {
    opacity: 0;
    transform: translate(-50%, -200%);
}
</style>
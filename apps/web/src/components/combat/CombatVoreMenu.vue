<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { App } from 'mmolike_rpg-application/core';

const playerStore = usePlayerStore();
const { playerId } = storeToRefs(playerStore);

const emit = defineEmits(['select-action']);

const useRegurgitate = () => {
    if (!playerId.value) return;
    // Call the application command to initiate regurgitation
    App.commands.regurgitate(playerId.value);
    // Tell the parent modal to close the submenu
    emit('select-action', 'regurgitate');
}

const useDevourSkill = () => {
    // This is typically the same flow as selecting a skill, but we hardcode the ID.
    emit('select-action', { id: 'skill_devour', name: 'Devour', target: 'Enemy' });
}

// NOTE: This array of menu options can be expanded later for Vore types, etc.
const menuOptions = [
    { id: 'devour', label: 'Devour (Skill)', icon: 'pi-bolt', action: useDevourSkill, severity: 'primary' },
    { id: 'regurgitate', label: 'Regurgitate', icon: 'pi-undo', action: useRegurgitate, severity: 'secondary' },
];
</script>

<template>
    <div class="space-y-2 max-h-64 overflow-y-auto">
        <Button v-for="option in menuOptions" :key="option.id" :severity="option.severity" @click="option.action"
            class="w-full !justify-start text-left p-3">
            <i :class="['pi', option.icon]" class="text-xl"></i>
            <span class="flex-grow font-bold">{{ option.label }}</span>
        </Button>
    </div>
</template>

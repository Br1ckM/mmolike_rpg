<script setup lang="ts">
import { ref } from 'vue';
import Button from '@/volt/Button.vue';

interface CombatAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

const emit = defineEmits(['action']);

const handleAction = (actionId: string) => {
  console.log(`Action taken: ${actionId}`);
  emit('action', actionId);
};

const actions = ref<CombatAction[]>([
  { id: 'attack', label: 'Attack', icon: 'pi pi-bolt', action: () => handleAction('attack') },
  { id: 'defend', label: 'Defend', icon: 'pi pi-shield', action: () => handleAction('defend') },
  { id: 'skills', label: 'Skills', icon: 'pi pi-star', action: () => handleAction('skills') },
  { id: 'item', label: 'Item', icon: 'pi pi-box', action: () => handleAction('item') },
  { id: 'flee', label: 'Flee', icon: 'pi pi-directions-alt', action: () => handleAction('flee') },
]);

// This is where you could add new actions in the future
// For example:
/*
if (someConditionForVore) {
  actions.value.push({ id: 'vore', label: 'Vore', icon: 'pi pi-...', action: () => handleAction('vore') });
}
*/
</script>

<template>
    <div class="bg-surface-800 border-t-4 border-surface-700 p-4 flex justify-center items-center space-x-2">
        <div v-for="action in actions" :key="action.id">
            <Button
                @click="action.action"
                class="!p-4"
            >
                <div class="flex flex-col items-center space-y-1">
                    <i :class="action.icon" class="text-2xl"></i>
                    <span class="text-xs font-semibold">{{ action.label }}</span>
                </div>
            </Button>
        </div>
    </div>
</template>

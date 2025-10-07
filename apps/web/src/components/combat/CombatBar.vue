<script setup lang="ts">
import { ref, computed } from 'vue';
import Button from '@/volt/Button.vue';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';

interface CombatAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

const emit = defineEmits(['action']);

const settingsStore = useSettingsStore();
const { showVoreContent } = storeToRefs(settingsStore);

const handleAction = (actionId: string) => {
  console.log(`Action taken: ${actionId}`);
  emit('action', actionId);
};

const actions = computed<CombatAction[]>(() => {
  const baseActions: CombatAction[] = [
    { id: 'attack', label: 'Attack', icon: 'pi pi-bolt', action: () => handleAction('attack') },
    { id: 'defend', label: 'Defend', icon: 'pi pi-shield', action: () => handleAction('defend') },
    { id: 'skills', label: 'Skills', icon: 'pi pi-star', action: () => handleAction('skills') },
    { id: 'item', label: 'Item', icon: 'pi pi-box', action: () => handleAction('item') },
  ];

  if (showVoreContent.value) {
    // Change Vore from a direct skill action to a menu opener
    baseActions.push({ id: 'vore-menu', label: 'Vore', icon: 'pi pi-heart-fill', action: () => handleAction('vore-menu') });
  }

  baseActions.push({ id: 'flee', label: 'Flee', icon: 'pi pi-directions-alt', action: () => handleAction('flee') });

  return baseActions;
});

</script>

<template>
  <div class="bg-surface-800 border-t-4 border-surface-700 p-4 flex justify-center items-center space-x-2">
    <div v-for="action in actions" :key="action.id">
      <Button @click="action.action" class="!p-4">
        <div class="flex flex-col items-center space-y-1">
          <i :class="action.icon" class="text-2xl"></i>
          <span class="text-xs font-semibold">{{ action.label }}</span>
        </div>
      </Button>
    </div>
  </div>
</template>

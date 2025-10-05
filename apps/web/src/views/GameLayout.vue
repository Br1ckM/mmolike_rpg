<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue';
import CombatModal from '@/components/combat/CombatModal.vue';
import { onMounted } from 'vue';

import { usePlayerStore } from '@/stores/player'
import { useGameStore } from '@/stores/game';

onMounted(() => {
    const playerStore = usePlayerStore();
    const gameStore = useGameStore();

    playerStore.initialize();
    gameStore.initialize();
})
</script>

<template>
  <div class="bg-surface-900 min-h-screen font-sans flex h-screen w-screen overflow-x-hidden">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
    <CombatModal />
  </div>
</template>
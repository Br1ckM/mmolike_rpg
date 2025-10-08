<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue';
import CombatModal from '@/components/combat/CombatModal.vue';
// No longer need onMounted or the stores here
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
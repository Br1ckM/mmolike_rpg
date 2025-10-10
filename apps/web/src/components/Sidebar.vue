<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';

const gameStore = useGameStore();
const { timeOfDay } = storeToRefs(gameStore);

const timeOfDayIcon = computed(() => {
  switch (timeOfDay.value) {
    case 'Morning':
    case 'Afternoon':
      return 'pi pi-sun';
    case 'Evening':
    case 'Night':
      return 'pi pi-moon';
    default:
      return 'pi pi-question';
  }
});

const mainNavLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Hub', path: '/hub' },
  { name: 'Character', path: '/character' },
  { name: 'Inventory', path: '/inventory' },
  { name: 'Camp', path: '/camp' },
  { name: 'Codex', path: '/codex' },
];

const bottomNavLinks = [
  { name: 'Combat Simulator', path: '/simulator' },
  { name: 'Design System', path: '/design' },
  { name: 'About / FAQ', path: '/about' },
  { name: 'Settings', path: '/settings' },
];

const isDev = import.meta.env.DEV;
if (isDev) {
  bottomNavLinks.unshift({ name: 'Admin Panel', path: '/admin' });
}
</script>

<template>
  <aside class="w-64 bg-surface-800 text-surface-200 hidden md:flex flex-col">
    <div class="p-4 flex-shrink-0">
      <h1 class="text-xl font-bold text-primary-400">MMOLIKE-RPG</h1>
    </div>

    <div class="relative group flex items-center justify-center p-2 mb-2">
      <i :class="[timeOfDayIcon, 'text-2xl text-surface-500 group-hover:text-amber-400 transition-colors']"></i>
      <div class="absolute left-full ml-4 hidden group-hover:block w-max z-20 
                        bg-surface-700 text-surface-100 text-sm font-semibold rounded-md px-3 py-1 shadow-lg">
        {{ timeOfDay }}
      </div>
    </div>

    <nav class="p-2 flex flex-col flex-grow">
      <div class="flex flex-col gap-1">
        <RouterLink v-for="link in mainNavLinks" :key="link.name" :to="link.path"
          class="block px-3 py-2 rounded-md font-semibold transition-colors duration-200 hover:bg-surface-700 hover:text-surface-0">
          {{ link.name }}
        </RouterLink>
      </div>

      <div class="mt-auto flex flex-col gap-1">
        <RouterLink v-for="link in bottomNavLinks" :key="link.name" :to="link.path"
          class="block px-3 py-2 rounded-md font-semibold transition-colors duration-200 hover:bg-surface-700 hover:text-surface-0">
          {{ link.name }}
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.router-link-exact-active {
  background-color: var(--p-primary-400);
  color: var(--p-surface-900);
}
</style>
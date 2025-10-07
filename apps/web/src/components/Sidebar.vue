// src/components/Sidebar.vue (Corrected)

<script setup lang="ts">
const mainNavLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Hub', path: '/hub' },
  { name: 'Character', path: '/character' },
  { name: 'Inventory', path: '/inventory' },
  { name: 'Camp', path: '/camp' },
  { name: 'Codex', path: '/codex' },
];

const bottomNavLinks = [
  { name: 'Combat Simulator', path: '/simulator' }, // <-- NEW LINK
  { name: 'Design System', path: '/design' },
  { name: 'About / FAQ', path: '/about' },
  { name: 'Settings', path: '/settings' },
];

// This will only be true in development builds
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

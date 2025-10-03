// src/router/index.ts (Modified)

import { createRouter, createWebHistory } from 'vue-router'
import DesignSystem from '../views/DesignSystem.vue'
import GameLayout from '../views/GameLayout.vue'
import Placeholder from '../views/Placeholder.vue'
import Dashboard from '../views/Dashboard.vue'
import Hub from '../views/Hub.vue'
import Character from '../views/Character.vue'
import Inventory from '../views/Inventory.vue' // <-- IMPORTED

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // All game-related routes are children of GameLayout
      path: '/',
      component: GameLayout,
      children: [
        { path: '', redirect: '/dashboard' }, // Redirect root to dashboard
        { path: 'dashboard', name: 'dashboard', component: Dashboard, props: { pageName: 'Dashboard' } },
        { path: 'hub', name: 'hub', component: Hub, props: { pageName: 'Hub' } },
        { path: 'character', name: 'character', component: Character, props: { pageName: 'Character' } },
        { path: 'inventory', name: 'inventory', component: Inventory, props: { pageName: 'Inventory' } }, // <-- ROUTE UPDATED
        { path: 'camp', name: 'camp', component: Placeholder, props: { pageName: 'Camp' } },
        { path: 'codex', name: 'codex', component: Placeholder, props: { pageName: 'Codex' } },
        { path: 'about', name: 'about', component: Placeholder, props: { pageName: 'About / FAQ' } },
        { path: 'settings', name: 'settings', component: Placeholder, props: { pageName: 'Settings' } },
        { path: 'design', name: 'design', component: DesignSystem, props: { pageName: 'Design Board' } }
      ]
    },
  ],
})

export default router
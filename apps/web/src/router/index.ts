// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import DesignSystem from '../views/DesignSystem.vue'
import GameLayout from '../views/GameLayout.vue'
import Placeholder from '../views/Placeholder.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // All game-related routes are children of GameLayout
      path: '/',
      component: GameLayout,
      children: [
        { path: '', redirect: '/dashboard' }, // Redirect root to dashboard
        { path: 'dashboard', name: 'dashboard', component: Placeholder, props: { pageName: 'Dashboard' } },
        { path: 'hub', name: 'hub', component: Placeholder, props: { pageName: 'Hub' } },
        { path: 'character', name: 'character', component: Placeholder, props: { pageName: 'Character' } },
        { path: 'inventory', name: 'inventory', component: Placeholder, props: { pageName: 'Inventory' } },
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
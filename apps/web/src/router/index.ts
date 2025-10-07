// src/router/index.ts (Modified)

import { createRouter, createWebHistory } from 'vue-router'
import DesignSystem from '../views/DesignSystem.vue'
import GameLayout from '../views/GameLayout.vue'
import Placeholder from '../views/Placeholder.vue'
import Dashboard from '../views/Dashboard.vue'
import Hub from '../views/Hub.vue'
import Character from '../views/Character.vue'
import Inventory from '../views/Inventory.vue'
import Simulator from '../views/Simulator.vue'
import Settings from '../views/Settings.vue'
import Admin from '../views/Admin.vue' // <-- NEW IMPORT

const routes = [
  {
    // All game-related routes are children of GameLayout
    path: '/',
    component: GameLayout,
    children: [
      { path: '', redirect: '/dashboard' }, // Redirect root to dashboard
      { path: 'dashboard', name: 'dashboard', component: Dashboard },
      { path: 'hub', name: 'hub', component: Hub },
      { path: 'character', name: 'character', component: Character },
      { path: 'inventory', name: 'inventory', component: Inventory },
      { path: 'camp', name: 'camp', component: Placeholder, props: { pageName: 'Camp' } },
      { path: 'codex', name: 'codex', component: Placeholder, props: { pageName: 'Codex' } },
      { path: 'about', name: 'about', component: Placeholder, props: { pageName: 'About / FAQ' } },
      { path: 'settings', name: 'settings', component: Settings },
      { path: 'design', name: 'design', component: DesignSystem },
      { path: 'simulator', name: 'simulator', component: Simulator }
    ]
  },
];

// Conditionally add the admin route in development mode
if (import.meta.env.DEV) {
  routes[0].children.push({
    path: 'admin',
    name: 'admin',
    component: Admin
  });
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router


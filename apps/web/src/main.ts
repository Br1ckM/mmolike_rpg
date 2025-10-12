import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from './primevue';
import ToastService from 'primevue/toastservice';
import { App as GameApp } from 'mmolike_rpg-application/core';
import { ContentProvider } from './services/ContentProvider';

// Import Tailwind CSS
import './assets/main.css';

const app = createApp(App)

// Create Pinia instance and register it so we can access stores during startup
const pinia = createPinia();
app.use(pinia)
app.use(router)
app.use(PrimeVue);
app.use(ToastService); // <-- ensure the Toast service plugin is registered

// Initialize content provider and game app
(async () => {
    try {
        // Initialize content provider first
        ContentProvider.initialize(GameApp);

        // Start the package-level GameApp so App.isReady resolves and services (queries, content) are available
        if (GameApp && typeof (GameApp as any).start === 'function') {
            try { await (GameApp as any).start(); } catch (e) { /* non-fatal */ }
        }

        // Handle character creation modal
        const mod = await import('./stores/ui');
        const useUIStore = (mod as any).useUIStore;
        const ui = useUIStore();
        const saveExists = localStorage.getItem('player_save_exists') === 'true';
        if (!saveExists) ui.displayCharacterCreation();
    } catch (err) {
        console.error('Failed to initialize game:', err);
    }
})();

app.mount('#app')

if (import.meta.env.DEV) {
    (window as any).App = GameApp;
}
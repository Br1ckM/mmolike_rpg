import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from './primevue';
import ToastService from 'primevue/toastservice';
import { App as GameApp } from 'mmolike_rpg-application/core';

// Import Tailwind CSS
import './assets/main.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue);
app.use(ToastService); // <-- ensure the Toast service plugin is registered

app.mount('#app')

if (import.meta.env.DEV) {
    (window as any).App = GameApp;
}
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import PrimeVue from './primevue';
import ToastService from 'primevue/toastservice';

// Import Tailwind CSS
import './assets/main.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue);
app.use(ToastService); // <-- ensure the Toast service plugin is registered

app.mount('#app')
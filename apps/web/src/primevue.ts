import type { App, Plugin } from 'vue';
import PrimeVue from 'primevue/config';
import 'primeicons/primeicons.css';

const PrimeVuePlugin: Plugin = {
    install(app: App) {
        app.use(PrimeVue, {
            unstyled: true
        });
    }
};

export default PrimeVuePlugin;
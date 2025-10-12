import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
    const showCharacterCreation = ref(false);

    function hideCharacterCreation() {
        console.debug('[UIStore] hideCharacterCreation called', new Date().toISOString());
        // capture a short stack for tracing why this was invoked
        try { throw new Error('trace'); } catch (e: any) { console.debug(e.stack?.split('\n').slice(1, 6)); }
        showCharacterCreation.value = false;
    }

    function displayCharacterCreation() {
        console.debug('[UIStore] displayCharacterCreation called', new Date().toISOString());
        try { throw new Error('trace'); } catch (e: any) { console.debug(e.stack?.split('\n').slice(1, 6)); }
        showCharacterCreation.value = true;
    }

    return {
        showCharacterCreation,
        hideCharacterCreation,
        displayCharacterCreation,
    };
});
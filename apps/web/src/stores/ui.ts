import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
    const showCharacterCreation = ref(false);

    function hideCharacterCreation() {
        showCharacterCreation.value = false;
    }

    function displayCharacterCreation() {
        showCharacterCreation.value = true;
    }

    return {
        showCharacterCreation,
        hideCharacterCreation,
        displayCharacterCreation,
    };
});
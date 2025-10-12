import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { App } from 'mmolike_rpg-application/core';
import type { UIVoreRole } from './player';

export const useSettingsStore = defineStore('settings', () => {
    // --- State ---
    const isNsfwBuild = ref(import.meta.env.VITE_NSFW_BUILD === 'true');
    const showNsfwContent = ref(false);
    const showVoreContent = ref(false);
    const autoSaveEnabled = ref(true);

    // --- Getters ---
    const isVoreToggleVisible = computed(() => isNsfwBuild.value && showNsfwContent.value);

    // --- Actions ---

    function saveSettings() {
        localStorage.setItem('settings', JSON.stringify({
            showNsfwContent: showNsfwContent.value,
            showVoreContent: showVoreContent.value,
            autoSaveEnabled: autoSaveEnabled.value,
        }));
    }

    function toggleAutoSave() {
        autoSaveEnabled.value = !autoSaveEnabled.value;
        saveSettings();
    }

    function updateBackend() {
        App.commands.updateContentFilter(
            showNsfwContent.value,
            showVoreContent.value
        );
    }

    function toggleNsfwContent() {
        showNsfwContent.value = !showNsfwContent.value;
        if (!showNsfwContent.value) {
            showVoreContent.value = false;
        }
        saveSettings();
        updateBackend();
    }

    function toggleVoreContent() {
        showVoreContent.value = !showVoreContent.value;
        saveSettings();
        updateBackend();
    }

    function setPlayerVoreRole(playerId: number, newRole: UIVoreRole) {
        const playerSvc: any = App.playerService ?? (App.getService && App.getService('PlayerService'));
        if (playerSvc && typeof playerSvc.setPlayerVoreRole === 'function') {
            playerSvc.setPlayerVoreRole(playerId, newRole);
        } else {
            App.commands.setPlayerVoreRole(playerId, newRole);
        }
        // --- START FIX: Persist the user's choice ---
        localStorage.setItem('playerVoreRole', newRole);
        // --- END FIX ---
    }

    async function initialize() {
        await App.isReady;
        const storedSettings = localStorage.getItem('settings');
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            showNsfwContent.value = parsed.showNsfwContent ?? false;
            showVoreContent.value = parsed.showVoreContent ?? false;
            autoSaveEnabled.value = parsed.autoSaveEnabled ?? true;
        }
        updateBackend();
    }

    return {
        isNsfwBuild,
        showNsfwContent,
        showVoreContent,
        isVoreToggleVisible,
        initialize,
        toggleNsfwContent,
        toggleVoreContent,
        setPlayerVoreRole,
        toggleAutoSave,
        autoSaveEnabled,
    };
});


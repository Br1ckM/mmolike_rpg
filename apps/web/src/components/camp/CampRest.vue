<template>
    <div class="p-4">
        <Card>
            <template #title>
                <i class="pi pi-sun mr-2"></i> Rest
            </template>
            <template #content>
                <p class="mb-4">
                    Resting will restore your entire party's health and mana to their maximum values.
                </p>
                <Button label="Rest Until Healed" icon="pi pi-check" @click="performRest"
                    :disabled="!playerStore.player" />
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
import Button from 'primevue/button';
import { App } from 'mmolike_rpg-application';
import { usePlayerStore } from '@/stores/player';

const playerStore = usePlayerStore();

const performRest = () => {
    // FIX: The 'id' property is directly on the player object from the store.
    if (playerStore.player?.id) {
        App.commands.restAtCamp(playerStore.player.id);
    }
};
</script>
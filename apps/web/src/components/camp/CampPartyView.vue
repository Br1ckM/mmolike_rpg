<script setup lang="ts">
import { computed } from 'vue';
import { usePartyStore } from '@/stores/party';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import Button from '@/volt/Button.vue';
import Avatar from '@/volt/Avatar.vue';
import { App } from 'mmolike_rpg-application';

const props = defineProps<{ companionId: number }>();

const partyStore = usePartyStore();
const playerStore = usePlayerStore();
const { companions } = storeToRefs(partyStore);
const { playerId } = storeToRefs(playerStore);

const companion = computed(() => companions.value.find(c => c.id === props.companionId));

// --- ACTION HANDLERS ---
const talkToCompanion = () => {
    if (!playerId.value || !companion.value) return;
    App.commands.initiateDialogue(playerId.value, companion.value.id);
};

const swapPartyMember = () => {
    if (!playerId.value || !companion.value) return;
    App.commands.swapCompanion(playerId.value, companion.value.id);
};
</script>
<template>
    <div v-if="companion" class="flex flex-col items-center text-center h-full">
        <Avatar :image="companion.avatarUrl" size="xlarge" class="w-32 h-32 mb-4 flex-shrink-0" />
        <h2 class="text-3xl font-bold text-primary-400">{{ companion.name }}</h2>
        <p class="text-surface-400">Apprentice Herbalist</p>

        <div class="my-4 p-2 rounded-md"
            :class="companion.inActiveParty ? 'bg-green-500/20 text-green-300' : 'bg-surface-700 text-surface-400'">
            <span class="font-semibold">
                {{ companion.inActiveParty ? 'In Active Party' : 'At Camp' }}
            </span>
        </div>

        <div class="flex gap-4 mt-4">
            <Button label="Talk" icon="pi pi-comments" @click="talkToCompanion" />
            <Button :label="companion.inActiveParty ? 'Send to Camp' : 'Add to Party'"
                :icon="companion.inActiveParty ? 'pi pi-arrow-down' : 'pi pi-arrow-up'" @click="swapPartyMember"
                severity="secondary" />
        </div>

        <div class="border-t border-surface-700 w-full my-6"></div>

        <div class="flex gap-4">
            <Button label="Manage Equipment" icon="pi pi-shield" severity="secondary" disabled />
            <Button label="View Skills" icon="pi pi-star" severity="secondary" disabled />
        </div>
    </div>
    <div v-else class="text-center text-surface-500 italic">
        <p>Select a companion to view their details.</p>
    </div>
</template>
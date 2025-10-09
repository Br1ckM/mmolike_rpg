<script setup lang="ts">
import { ref } from 'vue';
import { usePartyStore } from '@/stores/party';
import { storeToRefs } from 'pinia';
import Avatar from '@/volt/Avatar.vue';

// Import the new child components (we will create these next)
import CampRest from '@/components/camp/CampRest.vue';
import CampPartyView from '@/components/camp/CampPartyView.vue';
import CampCrafting from '@/components/camp/CampCrafting.vue';

const partyStore = usePartyStore();
const { companions } = storeToRefs(partyStore);

// State to manage which view is active in the main panel
const activeView = ref<'rest' | 'crafting' | number>('rest');
</script>

<template>
    <div class="p-4 md:p-8 flex gap-4 md:gap-8 h-full">

        <div class="w-full md:w-1/4 flex-shrink-0 flex flex-col gap-6">
            <div class="bg-surface-800 rounded-lg shadow-lg p-4">
                <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Camp Actions</h2>
                <ul class="space-y-2">
                    <li @click="activeView = 'rest'" class="p-2 rounded-md cursor-pointer transition-colors"
                        :class="activeView === 'rest' ? 'bg-primary-500 text-white' : 'hover:bg-surface-700'">
                        Rest & Recover
                    </li>
                    <li @click="activeView = 'crafting'" class="p-2 rounded-md cursor-pointer transition-colors"
                        :class="activeView === 'crafting' ? 'bg-primary-500 text-white' : 'hover:bg-surface-700'">
                        Crafting & Upgrades
                    </li>
                </ul>
            </div>

            <div class="bg-surface-800 rounded-lg shadow-lg p-4 flex-grow min-h-0 flex flex-col">
                <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Companions</h2>
                <div class="space-y-3 overflow-y-auto flex-grow">
                    <div v-for="companion in companions" :key="companion.id" @click="activeView = companion.id"
                        class="flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors"
                        :class="activeView === companion.id ? 'bg-primary-500/50' : 'hover:bg-surface-700'">
                        <Avatar :image="companion.avatarUrl" shape="circle" />
                        <span class="font-semibold">{{ companion.name }}</span>
                    </div>
                    <p v-if="!companions.length" class="text-surface-400 italic text-sm">You are traveling alone.</p>
                </div>
            </div>
        </div>

        <div class="w-full md:w-3/4 bg-surface-800 rounded-lg shadow-lg p-4 md:p-6">
            <CampRest v-if="activeView === 'rest'" />
            <CampCrafting v-else-if="activeView === 'crafting'" />
            <CampPartyView v-else-if="typeof activeView === 'number'" :companion-id="activeView" :key="activeView" />
        </div>
    </div>
</template>
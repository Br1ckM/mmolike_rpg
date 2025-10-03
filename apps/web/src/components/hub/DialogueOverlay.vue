<script setup lang="ts">
import Dialog from '@/volt/Dialog.vue';
import Button from '@/volt/Button.vue';
import Avatar from '@/volt/Avatar.vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const gameStore = useGameStore();
const { dialogue, combat } = storeToRefs(gameStore);

const isOverlayActive = computed(() => dialogue.value !== null || combat.value !== null);

const selectResponse = (index: number) => {
    gameStore.selectDialogueResponse(index);
};

// Action to prevent the read-only computed property from crashing the Dialog component
const doNothing = () => {}; 
</script>

<template>
    <Dialog 
        :visible="isOverlayActive"
        @update:visible="doNothing"
        :modal="true" 
        :closable="false"
        header="Interaction" 
        
        class="w-11/12 md:w-3/4 lg:w-3/5 xl:w-1/2 h-[75vh]" 
        :pt="{ 
            root: 'max-h-[75%] max-w-2xl overflow-visible z-50', 
            // Collapse structural elements
            header: 'p-0 h-0 !m-0 !border-0',
            title: 'hidden', 
            headerActions: 'hidden', 
            // Content styling
            content: 'p-0 h-full bg-surface-900 rounded-xl overflow-visible', 
            mask: 'bg-black/80 z-40' 
        }"
    >
        <div v-if="dialogue" class="relative h-full flex flex-col pt-4 overflow-visible rounded-xl">
            
            <div class="absolute -top-12 -left-4 flex items-center gap-3 z-30">
                <Avatar :image="dialogue.npcImage" size="xxlarge" shape="square" class="flex-shrink-0 w-24 h-24 border-4 border-primary-400 shadow-2xl z-50" />
                
                <div class="bg-surface-800 px-16 py-2 mt-6 rounded-r-lg shadow-xl -ml-2 border-y-2 border-r-2 border-primary-400">
                    <h3 class="text-xl font-bold text-primary-400">{{ dialogue.npcName }}</h3>
                    <p class="text-sm text-surface-400 italic">Dialogue/Service</p>
                </div>
            </div>

            <div class="flex-grow overflow-y-auto p-4 pt-16 space-y-4 border-b border-surface-700">
                
                <div v-for="(entry, index) in dialogue.history" 
                     :key="index"
                     :class="[
                         'flex',
                         index === dialogue.history.length - 1 ? 'hidden' : '', 
                         entry.speaker === 'NPC' ? 'justify-start' : 'justify-end'
                     ]"
                >
                    <div :class="[
                        'max-w-[70%] p-3 rounded-xl shadow-md text-sm', 
                        entry.speaker === 'NPC' 
                            ? 'bg-surface-700 text-surface-400 border-l-4 border-l-surface-600'
                            : 'bg-primary-950 text-primary-200 border-r-4 border-r-primary-700' 
                    ]">
                        {{ entry.text }}
                    </div>
                </div>

                <div class="flex justify-start pt-2">
                    <div class="max-w-[80%] p-4 rounded-xl shadow-md bg-surface-700 text-surface-0 border-l-4 border-primary-400 font-bold text-lg">
                        {{ dialogue.text }}
                    </div>
                </div>

            </div>
            
            <div class="flex flex-col gap-2 p-4 flex-shrink-0 bg-surface-900 border-t border-surface-700">
                <Button 
                    v-for="(response, index) in dialogue.responses"
                    :key="index"
                    :label="response.text"
                    severity="secondary"
                    @click="selectResponse(index)"
                    class="justify-start text-lg w-full md:w-3/4 lg:w-2/3 mx-auto" 
                />
            </div>
        </div>
        
        <div v-else-if="combat" class="text-center p-8">
            <h3 class="text-2xl font-bold text-red-400">COMBAT IN PROGRESS</h3>
            <p class="mt-2 text-surface-400">Engaged with {{ combat.combatEntityId }}.</p>
        </div>
    </Dialog>
</template>
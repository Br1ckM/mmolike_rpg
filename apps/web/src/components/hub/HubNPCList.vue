// src/components/hub/HubNPCList.vue

<script setup lang="ts">
import Avatar from '@/volt/Avatar.vue';
import Button from '@/volt/Button.vue';
import { ref } from 'vue';
import { useHubStore } from '@/stores/hub'; // <-- IMPORTED
import { useGameStore } from '@/stores/game'; // <-- IMPORTED

interface HubEntity {
    id: number;
    name: string;
    description: string;
    location: string;
    type: 'NPC' | 'Shop' | 'Trainer';
    imageUrl: string;
}

const entities = ref<HubEntity[]>([
    {
        id: 1,
        name: 'Mayor Elara',
        description: 'The town leader, currently concerned about goblin activity.',
        location: 'Town Hall',
        type: 'NPC',
        imageUrl: 'https://placehold.co/150x150/4ade80/000?text=ME',
    },
    {
        id: 2,
        name: 'Grizzle\'s General Store',
        description: 'Buy and sell common goods and adventuring supplies.',
        location: 'Market Square',
        type: 'Shop',
        imageUrl: 'https://placehold.co/150x150/fbbf24/000?text=GS',
    },
    {
        id: 3,
        name: 'Guard Captain Liam',
        description: 'Training and advice for warriors.',
        location: 'Barracks',
        type: 'Trainer',
        imageUrl: 'https://placehold.co/150x150/3b82f6/000?text=CL',
    },
]);

const hubStore = useHubStore();
const gameStore = useGameStore();

const selectEntity = (entity: HubEntity) => {
    hubStore.setActiveEntity(entity); // 1. Set the active entity in the hub store, including image URL
    
    // 2. Decide how to interact
    if (entity.type === 'NPC' || entity.type === 'Shop' || entity.type === 'Trainer') {
        // For complex entities, always start with dialogue
        gameStore.startDialogue(entity.id, entity.name);
    } 
};
</script>

<template>
    <div class="h-full flex flex-col">
        
        <div class="space-y-4 overflow-y-auto flex-grow">
            
            <div 
                v-for="entity in entities" 
                :key="entity.id"
                @click="selectEntity(entity)"
                class="bg-surface-700 rounded-lg p-3 flex items-center gap-4 hover:bg-surface-600 transition-colors duration-200 cursor-pointer"
            >
                <Avatar :image="entity.imageUrl" size="large" shape="square" />
                
                <div class="flex-grow">
                    <p class="text-lg font-semibold text-surface-0">{{ entity.name }}</p>
                    <p class="text-sm text-surface-400">{{ entity.description }}</p>
                </div>

                <div class="text-right">
                    <p class="text-xs font-semibold text-primary-300">{{ entity.type.toUpperCase() }}</p>
                    <p class="text-xs text-surface-400 italic">({{ entity.location }})</p>
                </div>

            </div>
            
        </div>
    </div>
</template>
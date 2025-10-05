<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/solid';
// FIX: Import the player store and storeToRefs
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

// FIX: Remove mock data and get real data from the store
const playerStore = usePlayerStore();
const { activeQuests } = storeToRefs(playerStore);

// Helper function to calculate percentage
const getProgress = (current: number, required: number) => {
  return Math.min((current / required) * 100, 100);
};
</script>

<template>
  <div class="h-full flex flex-col">
    <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">
      Active Quests
    </h2>

    <div class="overflow-y-auto flex-grow">
      <ul v-if="activeQuests.length > 0" class="space-y-3">
        <li v-for="quest in activeQuests" :key="quest.id">
          
          <div class="font-semibold flex items-center gap-2 text-surface-0">
            <ArrowPathIcon class="w-5 h-5 text-amber-400" />
            <span>{{ quest.name }}</span>
          </div>

          <ul class="pl-7 mt-1 text-sm text-surface-300 space-y-2">
            <li v-for="obj in quest.objectives" :key="obj.description">
              
              <div class="flex justify-between items-center mb-0.5">
                <span>{{ obj.description }}:</span>
                <span class="font-mono text-xs">
                  {{ obj.current }} / {{ obj.required }}
                </span>
              </div>

              <div class="bg-surface-900/40 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full bg-primary-400 transition-all"
                  :style="{ width: getProgress(obj.current, obj.required) + '%' }"
                ></div>
              </div>
            </li>
          </ul>

        </li>
      </ul>
      <p v-else class="text-surface-400 italic">You have no active quests.</p>
    </div>
  </div>
</template>
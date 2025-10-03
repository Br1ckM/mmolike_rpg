<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/solid';
import { ref } from 'vue';

// Temporary reactive data for demonstration, replace with a store later
const activeQuests = ref([
  {
    id: 1,
    name: 'A Goblin Menace',
    // use our Mallorn Gold for quest icons/emphasis
    iconColor: 'text-tertiary-400',
    objectives: [
      { description: 'Goblin Scouts Slain', current: 5, required: 10, unit: 'Slain' },
      { description: 'Goblin Ears Collected', current: 2, required: 5, unit: 'Collected' },
    ]
  }
]);

// Helper function to calculate percentage
const getProgress = (current: number, required: number) => {
  return Math.min((current / required) * 100, 100);
};
</script>

<template>
  <div class="h-full flex flex-col">
    <h2 class="text-xl font-semibold mb-3 border-b border-secondary-600 pb-2 text-secondary-100">
      Active Quests
    </h2>

    <div class="overflow-y-auto flex-grow">
      <ul class="space-y-3">
        <li v-for="quest in activeQuests" :key="quest.id">
          
          <div class="font-semibold flex items-center gap-2 text-secondary-50">
            <ArrowPathIcon class="w-5 h-5" :class="quest.iconColor" />
            <span>{{ quest.name }}</span>
          </div>

          <ul class="pl-7 mt-1 text-sm text-secondary-300 space-y-2">
            <li v-for="obj in quest.objectives" :key="obj.description" class="list-none">
              
              <div class="flex justify-between items-center mb-0.5">
                <span>{{ obj.description }}:</span>
                <span class="font-mono text-xs text-secondary-200">
                  {{ obj.current }} / {{ obj.required }}
                </span>
              </div>

              <!-- Track uses moonlit silver; fill uses emerald -->
              <div class="bg-secondary-900/40 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full bg-primary-400 transition-all"
                  :style="{ width: getProgress(obj.current, obj.required) + '%' }"
                ></div>
              </div>
            </li>
          </ul>

        </li>
      </ul>
    </div>
  </div>
</template>

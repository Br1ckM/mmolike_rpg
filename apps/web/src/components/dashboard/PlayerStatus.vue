// src/components/dashboard/PlayerStatus.vue

<script setup lang="ts">
import Avatar from '@/volt/Avatar.vue';
import Badge from '@/volt/Badge.vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

const playerStore = usePlayerStore();

// Destructure the necessary state and getters into reactive refs
const {
  player,
  healthValues,
  manaValues,
  healthPercentage,
  manaPercentage,
  experience
} = storeToRefs(playerStore); 
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Player Status</h2>
    <div class="flex items-center gap-4">
      <div class="relative">
        <Avatar image="https://placehold.co/150x150/27272a/eab308?text=A" size="xlarge" shape="circle" />
        <Badge :value="experience.level" severity="danger" class="absolute -right-2 -bottom-2"></Badge>
      </div>
      <div>
        <p class="font-bold text-lg">{{ player?.name ?? 'Adventurer' }}</p>
        <p class="text-surface-400">Level {{ experience.level }} Adventurer</p>
      </div>
    </div>
    <div class="mt-4 space-y-3">
      <div>
        <div class="flex items-center justify-between mb-1 text-sm">
          <label class="block font-semibold">Health</label>
          <span class="font-mono text-green-400">{{ healthValues.display }}</span>
        </div>
        <div class="bg-black/20 rounded-full h-3 overflow-hidden">
          <div class="h-full bg-green-500 transition-width duration-300 ease-in-out"
            :style="{ width: healthPercentage + '%' }"></div>
        </div>
      </div>
      <div>
        <div class="flex items-center justify-between mb-1 text-sm">
          <label class="block font-semibold">Mana</label>
          <span class="font-mono text-sky-400">{{ manaValues.display }}</span>
        </div>
        <div class="bg-black/20 rounded-full h-3 overflow-hidden">
          <div class="h-full bg-sky-400 transition-width duration-300 ease-in-out"
            :style="{ width: manaPercentage + '%' }"></div>
        </div>
      </div>
      <div>
        <div class="flex items-center justify-between mb-1 text-sm">
          <label class="block font-semibold">Experience</label>
          <span class="font-mono text-amber-400">{{ experience.display }}</span>
        </div>
        <div class="bg-black/20 rounded-full h-3 overflow-hidden">
          <div class="h-full bg-amber-500 transition-width duration-300 ease-in-out"
            :style="{ width: experience.percentage + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

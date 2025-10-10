<script setup lang="ts">
import Button from '@/volt/Button.vue';
import { computed } from 'vue';
import { useHubStore } from '@/stores/hub';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { App } from 'mmolike_rpg-application';

// --- Get Live Data from Store ---
const hubStore = useHubStore();
const playerStore = usePlayerStore();
const { hubName, nodes, location, zoneId } = storeToRefs(hubStore);
const { playerId } = storeToRefs(playerStore);

// --- NEW: Filtered list of nodes to display ---
const discoveredNodes = computed(() => {
  // The hub the player is in is also a "node" in the zone's container, so we filter it out.
  const hubNodeId = location.value?.id;
  return nodes.value.filter(n => n.NodeComponent.discovered && n.id !== hubNodeId);
});

// --- Logic ---


const explore = () => {
  if (!playerId.value || !zoneId.value) return;
  App.commands.exploreInZone(playerId.value, zoneId.value);
};

/** Handles a click on an existing map node */
const visitNode = (node: any) => {
  if (!playerId.value) return;
  App.commands.interactWithNode(playerId.value, node.id);
};

</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-start mb-4 flex-shrink-0">
      <h2 class="text-2xl font-bold text-primary-400">{{ hubName }}</h2>
      <div class="flex justify-center flex-shrink-0 z-10 -mt-2">
        <Button label="Explore The Area" icon="pi pi-search" @click="explore" />
      </div>
    </div>

    <div
      class="flex-grow bg-surface-900 rounded-md flex items-center justify-center mb-4 min-h-0 relative overflow-hidden border border-surface-700">
      <p class="text-surface-500 absolute">Zone Map Visual Placeholder</p>

      <div v-for="node in discoveredNodes" :key="node.id" class="absolute group" :style="{
        top: node.NodeComponent.position?.top || '50%',
        left: node.NodeComponent.position?.left || '50%'
      }">
        <button @click="visitNode(node)" :title="node.NodeComponent.name"
          class="w-8 h-8 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 flex items-center justify-center relative z-10 bg-primary-700 border-primary-400 hover:bg-primary-600">
          <i class="pi pi-map-marker text-white text-lg"></i>
        </button>

        <div
          class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block w-max z-20 bg-surface-800 text-surface-50 text-xs rounded-md px-2 py-1 shadow-md">
          <div class="font-bold">{{ node.NodeComponent.name }}</div>
          <div class="text-surface-300 italic text-[10px]">{{ node.NodeComponent.description }}</div>

          <div v-if="node.NodeComponent.isDepletable"
            class="text-amber-400 font-semibold mt-1 border-t border-surface-700 pt-1">
            Uses Remaining: {{ node.NodeComponent.usesRemaining }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
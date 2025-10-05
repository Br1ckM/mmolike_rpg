<script setup lang="ts">
import Button from '@/volt/Button.vue';
import Dialog from '@/volt/Dialog.vue';
import { ref, computed } from 'vue';
import { useHubStore } from '@/stores/hub';
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia';
import { App } from 'mmolike_rpg-application';

// Define types for map nodes and events
interface MapNode {
  id: number;
  name: string;
  type: 'Permanent' | 'Limited';
  visitsRemaining?: number;
  top: string;
  left: string;
  icon: string;
}

interface EventResult {
  title: string;
  message: string;
  icon: string;
  isInteractive: boolean;
}

// --- Component State ---
const showEventModal = ref(false);
const eventResult = ref<EventResult | null>(null);

// --- Get Live Data from Store ---
const hubStore = useHubStore();
const playerStore = usePlayerStore();
const { hubName, nodes } = storeToRefs(hubStore);
const { player } = storeToRefs(playerStore);

// --- Logic ---

/** Simulates the "roll on a table" for exploration */
const explore = () => {
  const roll = Math.random();

  if (roll < 0.3) {
    eventResult.value = {
      title: "Nothing of Interest",
      message: "You spent some time investigating the thicket but found only damp leaves and buzzing insects.",
      icon: 'pi pi-compass',
      isInteractive: false
    };
  } else if (roll < 0.6) {
    eventResult.value = {
      title: "Encounter: Sneaky Goblins!",
      message: "A small patrol of goblins leaps out from behind a mossy rock. Prepare for battle!",
      icon: 'pi pi-exclamation-triangle',
      isInteractive: true
    };
  } else {
    eventResult.value = {
      title: "Treasure Chest Found!",
      message: "A small, locked chest is hidden beneath a tree root. You sense valuable loot inside.",
      icon: 'pi pi-gift',
      isInteractive: true
    };
  }

  showEventModal.value = true;
};

/** Simulates the addition of a new, permanent node after an event */
const addNewNode = () => {
  const newNode: MapNode & { NodeComponent: { name: string; description: string } } = {
    id: Date.now(),
    name: "Barterbrew's Caravan",
    type: 'Permanent',
    icon: 'pi pi-home',
    top: '10%',
    left: '10%',
    NodeComponent: {
      name: "Barterbrew's Caravan",
      description: 'A wandering merchant caravan offering goods and rumors.'
    }
  };
  // push to the store-backed nodes ref
  (nodes as any).value.push(newNode);
  console.log(`New permanent node added: ${newNode.name}`);
};

/** Handles a click on an existing map node */
const visitNode = (node: any) => {
    if (!player.value) return;
    // FIX: Call the backend command service
    App.commands.interactWithNode(player.value.id, node.id);
};

// Placeholder for event interaction (e.g., Fight, Loot)
const handleModalAction = () => {
  console.log(`Modal action taken for: ${eventResult.value?.title}`);
  if (eventResult.value?.title.includes("Encounter")) {
    addNewNode();
  }
  showEventModal.value = false;
};

// Helper: node status text
const getNodeStatus = (node: MapNode): string => {
  if (node.type === 'Limited') {
    if (node.visitsRemaining === 0) return 'Depleted';
    return `${node.visitsRemaining} visits remaining`;
  }
  return 'Permanent Location';
};

// --- UI Helpers bound to Elven Glade palette ---

// Button color classes per node state
const nodeButtonClass = (node: MapNode) => {
  const base = 'w-8 h-8 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 flex items-center justify-center relative z-10';
  const depleted = (node.type === 'Limited' && node.visitsRemaining === 0);
  if (depleted) {
    return `${base} bg-secondary-800 border-secondary-600 opacity-50 cursor-not-allowed`;
  }
  return node.type === 'Permanent'
    ? `${base} bg-primary-700 border-primary-400 hover:bg-primary-600`
    : `${base} bg-tertiary-600 border-tertiary-400 hover:bg-tertiary-500`;
};

// Tooltip wrapper classes
const tooltipClass = 'absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block w-max z-20 bg-secondary-800 text-secondary-50 text-xs rounded-md px-2 py-1 shadow-md transition-opacity opacity-0 group-hover:opacity-100 duration-200';

// Event icon color by type
const eventIconClass = computed(() => {
  const title = eventResult.value?.title ?? '';
  if (title.includes('Treasure')) return 'text-tertiary-400';
  if (title.includes('Encounter')) return 'text-primary-400';
  return 'text-secondary-300';
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-start mb-4 flex-shrink-0">
      <h2 class="text-2xl font-bold text-primary-400">{{ hubName }}</h2>
      <div class="flex justify-center flex-shrink-0 z-10 -mt-2">
        <Button label="Explore" icon="pi pi-search" @click="explore" />
      </div>
    </div>
    
    <div class="flex-grow bg-surface-900 rounded-md flex items-center justify-center mb-4 min-h-0 relative overflow-hidden border border-surface-700">
      <p class="text-surface-500 absolute">Zone Map Visual Placeholder</p>

      <div 
        v-for="node in nodes" 
        :key="node.id"
        class="absolute group"
        :style="{ 
          top: node.NodeComponent.position?.top || '50%', 
          left: node.NodeComponent.position?.left || '50%' 
        }"
      >
        <button 
          @click="visitNode(node)"
          :title="node.NodeComponent.name"
          class="w-8 h-8 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 transition-colors duration-200 flex items-center justify-center relative z-10 bg-primary-700 border-primary-400 hover:bg-primary-600"
        >
          <i class="pi pi-map-marker text-white text-lg"></i> 
        </button>

        <div class="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block w-max z-20 bg-surface-800 text-surface-50 text-xs rounded-md px-2 py-1 shadow-md">
          <div class="font-bold">{{ node.NodeComponent.name }}</div>
          <div class="text-surface-300 italic text-[10px]">{{ node.NodeComponent.description }}</div>
        </div>
      </div>
    </div> 

    <Dialog v-model:visible="showEventModal" :header="eventResult?.title" :modal="true" :closable="true" class="min-w-80">
      <div class="flex items-center gap-3">
        <i class="text-2xl" :class="[eventResult?.icon, 'text-primary-400']"></i>
        <p>{{ eventResult?.message }}</p>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button 
          v-if="eventResult?.isInteractive"
          :label="eventResult.title.includes('Encounter') ? 'Fight!' : 'Interact'" 
          @click="showEventModal = false" 
        />
        <Button 
          label="Continue" 
          severity="secondary" 
          @click="showEventModal = false" 
        />
      </div>
    </Dialog>
  </div>
</template>
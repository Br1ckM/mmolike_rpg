<script setup lang="ts">
import Button from '@/volt/Button.vue';
import Dialog from '@/volt/Dialog.vue';
import { ref, computed } from 'vue';

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

// Static/Simulated Map Nodes with Icons and updated positions
const mapNodes = ref<MapNode[]>([
  { id: 101, name: "Old Campfire", type: 'Permanent', icon: 'pi pi-fire', top: '25%', left: '40%' },
  { id: 102, name: "Copper Vein", type: 'Limited', visitsRemaining: 3, icon: 'pi pi-box', top: '60%', left: '70%' },
]);

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
  const newNode: MapNode = {
    id: Date.now(),
    name: "Barterbrew's Caravan",
    type: 'Permanent',
    icon: 'pi pi-home',
    top: '10%',
    left: '10%',
  };
  mapNodes.value.push(newNode);
  console.log(`New permanent node added: ${newNode.name}`);
};

/** Handles a click on an existing map node */
const visitNode = (node: MapNode) => {
  eventResult.value = {
    title: `Visiting ${node.name}`,
    message: node.type === 'Limited'
      ? `You have ${node.visitsRemaining} visits remaining.`
      : `This is a permanent location.`,
    icon: node.icon,
    isInteractive: true
  };
  showEventModal.value = true;
  // if (node.type === 'Limited') { node.visitsRemaining--; }
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
      <h2 class="text-2xl font-bold text-primary-400">Whispering Glade</h2>
      <div class="flex justify-center flex-shrink-0 z-10 -mt-2">
        <Button label="Explore" icon="pi pi-search" @click="explore" />
      </div>
    </div>
    
    <!-- Map container shifted to moonlit silver (secondary) family -->
    <div class="flex-grow bg-secondary-900 rounded-md flex items-center justify-center mb-4 min-h-0 relative overflow-hidden border border-secondary-700">
      <p class="text-secondary-500 absolute">Zone Map Visual Placeholder</p>

      <div 
        v-for="node in mapNodes" 
        :key="node.id"
        class="absolute group"
        :style="{ top: node.top, left: node.left }"
      >
        <button 
          @click="visitNode(node)"
          :title="`${node.name} (${node.type})`"
          :class="nodeButtonClass(node)"
          :disabled="node.type === 'Limited' && node.visitsRemaining === 0"
        >
          <i :class="node.icon" class="text-white text-lg"></i> 
        </button>

        <div :class="tooltipClass">
          <div class="font-bold">{{ node.name }}</div>
          <div class="text-secondary-300 italic text-[10px]">{{ getNodeStatus(node) }}</div>
        </div>
      </div>
    </div> 

    <Dialog v-model:visible="showEventModal" :header="eventResult?.title" :modal="true" :closable="true" class="min-w-80">
      <div class="flex items-center gap-3">
        <i class="text-2xl" :class="[eventResult?.icon, eventIconClass]"></i>
        <p>{{ eventResult?.message }}</p>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button 
          v-if="eventResult?.isInteractive"
          :label="eventResult.title.includes('Encounter') ? 'Fight!' : 'Loot!'" 
          @click="handleModalAction" 
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

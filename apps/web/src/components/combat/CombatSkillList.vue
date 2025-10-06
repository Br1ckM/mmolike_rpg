<script setup lang="ts">
import Button from '@/volt/Button.vue';

interface Skill {
  id: string;
  name: string;
  description: string;
  costs: { stat: string; amount: number }[];
}

defineProps<{
  skills: Skill[];
}>();

const emit = defineEmits(['select']);
</script>

<template>
  <div class="space-y-2 max-h-64 overflow-y-auto">
    <!-- FIX: Wrap button in a div and move the click handler here -->
    <div v-for="skill in skills" :key="skill.id" @click="emit('select', skill)" class="cursor-pointer">
      <Button severity="secondary" class="w-full !justify-start text-left p-3 pointer-events-none" tabindex="-1">
        <div class="flex-grow">
          <p class="font-bold">{{ skill.name }}</p>
          <p class="text-xs text-surface-400 italic">{{ skill.description }}</p>
        </div>
        <div v-if="skill.costs.length" class="text-right text-xs flex-shrink-0 ml-4">
          <div v-for="cost in skill.costs" :key="cost.stat">
            <span class="font-mono font-bold">{{ cost.amount }}</span>
            <span class="capitalize">{{ cost.stat }}</span>
          </div>
        </div>
      </Button>
    </div>
  </div>
</template>

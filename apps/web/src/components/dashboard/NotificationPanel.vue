// src/components/dashboard/NotificationPanel.vue (Modified)

<script setup lang="ts">
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';

const gameStore = useGameStore();
// Use storeToRefs to ensure reactivity on the notifications array
const { notifications } = storeToRefs(gameStore);

// Helper function to apply color based on notification type
const getLogColor = (type: string) => {
    switch (type) {
        case 'error':
            return 'text-red-400';
        case 'success':
            return 'text-green-400';
        case 'info':
        default:
            return 'text-surface-400';
    }
}
</script>

<template>
  <div class="h-full">
    <h2 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2">Log & Notifications</h2>
    <div class="text-sm space-y-1">
      <p 
          v-for="(notification, index) in notifications" 
          :key="index"
          :class="getLogColor(notification.type)"
      >
          <span class="font-bold">[{{ notification.type.toUpperCase() }}]:</span> 
          <span>{{ notification.message }}</span>
      </p>
      
      <p v-if="notifications.length === 0" class="text-surface-400">
        [SYSTEM]: Welcome to the world!
      </p>
    </div>
  </div>
</template>
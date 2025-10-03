<script setup lang="ts">
import ZoneMap from '@/components/dashboard/ZoneMap.vue';
import PlayerStatus from '@/components/dashboard/PlayerStatus.vue';
import ActiveQuests from '@/components/dashboard/ActiveQuests.vue';
import NotificationPanel from '@/components/dashboard/NotificationPanel.vue';
</script>

<template>
  <div class="p-4 md:p-8 flex gap-4 md:gap-8 h-full w-full"> 
    
    <div class="w-full md:w-3/4 **md:flex-none** flex flex-col gap-4 md:gap-8">
      <div class="bg-surface-800 rounded-lg shadow-lg p-4 md:p-6 flex-grow">
        <ZoneMap />
      </div>
      <div class="bg-surface-800 rounded-lg shadow-lg p-4 h-48 flex-grow-0 overflow-y-auto">
        <NotificationPanel />
      </div>
    </div>

    <div class="w-full md:w-1/4 **md:flex-none** flex flex-col gap-4 md:gap-8">
      <div class="bg-surface-800 rounded-lg shadow-lg p-4">
        <PlayerStatus />
      </div>
      <div class="bg-surface-800 rounded-lg shadow-lg p-4 flex-grow min-h-0">
        <ActiveQuests />
      </div>
    </div>
    
  </div>
</template>
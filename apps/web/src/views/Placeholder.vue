<script setup lang="ts">
defineProps<{
  pageName: string;
}>();
</script>

<template>
  <div class="p-8">
    <h1 class="text-4xl font-bold text-surface-0">{{ pageName }}</h1>
    <p class="mt-2 text-surface-400">This page is a placeholder and has not been implemented yet.</p>
  </div>
</template>
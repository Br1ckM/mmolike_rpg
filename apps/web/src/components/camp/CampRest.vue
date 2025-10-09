<script setup lang="ts">
import Button from '@/volt/Button.vue';
</script>
<template>
    <div>
        <h2 class="text-2xl font-bold text-surface-0 mb-4">Rest & Recover</h2>
        <p class="text-surface-300 mb-6">Resting will pass the time and fully restore your party's Health and Mana.</p>
        <div class="flex gap-4">
            <Button label="Rest until Morning" icon="pi pi-sun" />
            <Button label="Rest until Night" icon="pi pi-moon" severity="secondary" />
        </div>
    </div>
</template>
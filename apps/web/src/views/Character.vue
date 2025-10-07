// src/views/Character.vue (Updated)

<script setup lang="ts">
import Button from '@/volt/Button.vue';

// Component Imports
import CharacterIdentityAndStats from '@/components/character/CharacterIdentityAndStats.vue';
import CharacterEquipmentPanel from '@/components/character/CharacterEquipmentPanel.vue';
import CharacterSkillsList from '@/components/character/CharacterSkillsList.vue';
import CharacterAppearancePanel from '@/components/character/CharacterAppearancePanel.vue';
import StomachStatusPanel from '@/components/character/StomachStatusPanel.vue'; // <-- NEW IMPORT
</script>

<template>
    <div class="p-4 md:p-8 h-full overflow-y-auto">

        <div class="flex justify-between items-center mb-6 border-b border-surface-700 pb-2 flex-shrink-0">
            <div class="flex items-center gap-2">
                <h2 class="text-2xl font-bold text-surface-0">Viewing Character</h2>
                <span class="text-surface-400 text-lg">- Character Sheet</span>
            </div>
            <Button label="View Talent Tree" icon="pi pi-sitemap" severity="secondary" size="small" />
        </div>

        <CharacterIdentityAndStats />

        <CharacterAppearancePanel />

        <StomachStatusPanel /> <!-- <-- NEW COMPONENT -->

        <CharacterEquipmentPanel />

        <CharacterSkillsList />

    </div>
</template>

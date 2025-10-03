// src/views/Character.vue (Modified)

<script setup lang="ts">
import Button from '@/volt/Button.vue';
// Removed redundant Card import

// Component Imports
import CharacterIdentityAndStats from '@/components/character/CharacterIdentityAndStats.vue';
import CharacterEquipmentPanel from '@/components/character/CharacterEquipmentPanel.vue'; 
import CharacterSkillsList from '@/components/character/CharacterSkillsList.vue'; // <-- NEW IMPORT

import { ref, computed } from 'vue';

// --- MOCK DATA FOR THE REMAINING SECTIONS ---
// mockSkills has been removed from here
const mockEquipment = ref({
    Helm: { name: 'Draconic Helm', icon: 'pi pi-crown' },
    Cape: { name: 'Cloak of Shadows', icon: 'pi pi-star-fill' },
    Amulet: { name: 'Amulet of Clarity', icon: 'pi pi-briefcase' },
    Armor: { name: 'Iron Plate', icon: 'pi pi-shield' },
    Belt: { name: 'Utility Belt', icon: 'pi pi-tag' },
    MainHand: { name: 'War Axe', icon: 'pi pi-server' },
    OffHand: null,
    Gloves: { name: 'Gauntlets', icon: 'pi pi-box' },
    Ring1: null,
    Ring2: { name: 'Signet Ring', icon: 'pi pi-circle-fill' },
    Boots: { name: 'Leather Boots', icon: 'pi pi-send' },
    Charm1: null,
    Charm2: { name: 'Fire Charm', icon: 'pi pi-heart-fill' },
    Charm3: null,
});

const equipmentSlots = computed(() => {
    return Object.keys(mockEquipment.value);
});

// Helper functions for Equipment Panel (these remain until that panel is removed/split further)
const getEquipmentIcon = (slot: string) => {
    switch (slot) {
        case 'Helm': return 'pi pi-crown';
        case 'Armor': return 'pi pi-book';
        case 'Gloves': return 'pi pi-box';
        case 'Boots': return 'pi pi-send';
        case 'MainHand': return 'pi pi-bolt';
        case 'OffHand': return 'pi pi-shield-fill';
        case 'Cape': return 'pi pi-star-fill';
        case 'Amulet': return 'pi pi-briefcase';
        case 'Belt': return 'pi pi-tag';
        case 'Ring1': case 'Ring2': return 'pi pi-circle-fill';
        case 'Charm1': case 'Charm2': case 'Charm3': return 'pi pi-heart-fill';
        default: return 'pi pi-question';
    }
};

const getSlotPosition = (slot: string) => {
    switch (slot) {
        case 'Helm': return { top: '5%', left: '50%' };
        case 'Armor': return { top: '40%', left: '50%' };
        case 'Belt': return { top: '55%', left: '50%' };
        case 'Boots': return { top: '75%', left: '50%' };
        case 'MainHand': return { top: '35%', left: '15%' };
        case 'Gloves': return { top: '50%', left: '15%' };
        case 'Ring1': return { top: '65%', left: '15%' };
        case 'OffHand': return { top: '35%', right: '15%' };
        case 'Cape': return { top: '15%', right: '15%' }; 
        case 'Amulet': return { top: '25%', right: '15%' };
        case 'Ring2': return { top: '65%', right: '15%' };
        case 'Charm1': return { top: '75%', right: '5%' };
        case 'Charm2': return { top: '85%', right: '5%' };
        case 'Charm3': return { top: '95%', right: '5%' };
        default: return { top: '50%', left: '50%' };
    }
};
// -----------------------------------------------------------------
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
        
        <CharacterEquipmentPanel />
        
        <CharacterSkillsList />
        
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import EquipmentSlot from '@/components/character/EquipmentSlot.vue';

const playerStore = usePlayerStore();
const { equippedItems } = storeToRefs(playerStore); // Use the new equippedItems from store

type EquipmentSlotKey = 'helm' | 'cape' | 'amulet' | 'armor' | 'belt' | 'gloves' | 'mainHand' | 'offHand' | 'ring1' | 'ring2' | 'boots' | 'charm1' | 'charm2' | 'charm3';

// Defines the structure and order of all slots to render
const equipmentSlots: { key: EquipmentSlotKey, name: string }[] = [
    { key: 'helm', name: 'Helm' },
    { key: 'amulet', name: 'Amulet' },
    { key: 'mainHand', name: 'Main Hand' },
    { key: 'armor', name: 'Armor' },
    { key: 'offHand', name: 'Off Hand' },
    { key: 'gloves', name: 'Gloves' },
    { key: 'belt', name: 'Belt' },
    { key: 'cape', name: 'Cape' },
    { key: 'ring1', name: 'Ring 1' },
    { key: 'boots', name: 'Boots' },
    { key: 'ring2', name: 'Ring 2' },
    { key: 'charm1', name: 'Charm 1' },
    { key: 'charm2', name: 'Charm 2' },
    { key: 'charm3', name: 'Charm 3' }
];

// grid-template-areas for paper-doll placement (3 columns wide)
const templateAreas = `
    "charm1 charm2 charm3"
    "cape helm amulet"
    "mainHand armor offHand"
    "gloves belt ."
    "ring1 boots ring2"

`.trim();
</script>

<template>
    <div class="bg-surface-800 rounded-lg shadow-lg p-4">
        <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Equipment</h3>

        <!-- paper-doll grid using template-areas; responsive behaviour still possible via CSS classes/media queries -->
        <div class="equipment-grid gap-3" :style="{
            display: 'grid',
            gridTemplateAreas: templateAreas,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gridAutoRows: '4.5rem',
            gap: '0.75rem'
        }">
            <EquipmentSlot v-for="slot in equipmentSlots" :key="slot.key" :slot-name="slot.name" :slot-type="slot.key"
                :item="equippedItems[slot.key]" :style="{ gridArea: slot.key }" />
        </div>
    </div>
</template>
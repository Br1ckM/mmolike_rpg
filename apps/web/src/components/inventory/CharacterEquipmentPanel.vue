<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import EquipmentSlot from '@/components/character/EquipmentSlot.vue';
import type { UIItem } from '@/stores/player';

const playerStore = usePlayerStore();
const { equipment, bags } = storeToRefs(playerStore);

const equippedItems = computed(() => {
    const allItemsById = new Map<number, UIItem>();
    bags.value.forEach(bag =>
        bag.items.forEach(item => {
            if (item) allItemsById.set(item.id, item);
        })
    );

    // Use the exact list of slots from your domain model
    const allSlots = [
        'helm', 'cape', 'amulet', 'armor', 'belt', 'gloves',
        'mainHand', 'offHand', 'ring1', 'ring2', 'boots',
        'charm1', 'charm2', 'charm3'
    ];

    const equipped: { [slot: string]: UIItem | null } = {};
    const equipmentData = equipment.value || {};

    allSlots.forEach(slot => {
        const itemId = equipmentData[slot];
        if (itemId) {
            equipped[slot] = allItemsById.get(parseInt(itemId, 10)) || null;
        } else {
            equipped[slot] = null;
        }
    });

    return equipped;
});
</script>

<template>
    <div class="equipment-grid">
        <EquipmentSlot :slot-name="'Helm'" :item="equippedItems['helm']" style="grid-area: helm" />
        <EquipmentSlot :slot-name="'Amulet'" :item="equippedItems['amulet']" style="grid-area: amulet" />
        <EquipmentSlot :slot-name="'Cape'" :item="equippedItems['cape']" style="grid-area: cape" />
        <EquipmentSlot :slot-name="'Main Hand'" :item="equippedItems['mainHand']" style="grid-area: mainHand" />
        <EquipmentSlot :slot-name="'Armor'" :item="equippedItems['armor']" style="grid-area: armor" />
        <EquipmentSlot :slot-name="'Off Hand'" :item="equippedItems['offHand']" style="grid-area: offHand" />
        <EquipmentSlot :slot-name="'Gloves'" :item="equippedItems['gloves']" style="grid-area: gloves" />
        <EquipmentSlot :slot-name="'Belt'" :item="equippedItems['belt']" style="grid-area: belt" />
        <EquipmentSlot :slot-name="'Ring 1'" :item="equippedItems['ring1']" style="grid-area: ring1" />
        <EquipmentSlot :slot-name="'Boots'" :item="equippedItems['boots']" style="grid-area: boots" />
        <EquipmentSlot :slot-name="'Ring 2'" :item="equippedItems['ring2']" style="grid-area: ring2" />
        <EquipmentSlot :slot-name="'Charm 1'" :item="equippedItems['charm1']" style="grid-area: charm1" />
        <EquipmentSlot :slot-name="'Charm 2'" :item="equippedItems['charm2']" style="grid-area: charm2" />
        <EquipmentSlot :slot-name="'Charm 3'" :item="equippedItems['charm3']" style="grid-area: charm3" />
    </div>
</template>

<style scoped>
.equipment-grid {
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(3, 80px);
    gap: 0.5rem;
    /* This layout "draws" the character shape using all 14 slots. */
    grid-template-areas:
        ".        helm      amulet"
        "mainHand armor     offHand"
        "gloves   belt      cape"
        "ring1    boots     ring2"
        "charm1   charm2    charm3";
}
</style>
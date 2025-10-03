// src/components/character/CharacterEquipmentPanel.vue (Redesigned with SVG Paper Doll)

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// --- MOCK DATA FOR THIS PANEL (Moved here for component self-containment) ---
const mockEquipment = ref({
    Helm: { name: 'Draconic Helm', icon: 'pi pi-crown', stats: '+10 INT' },
    Cape: { name: 'Cloak of Shadows', icon: 'pi pi-star-fill', stats: '+5 Dodge' },
    Amulet: { name: 'Amulet of Clarity', icon: 'pi pi-briefcase', stats: '+2 Spirit' },
    Armor: { name: 'Iron Plate', icon: 'pi pi-book', stats: '+10 DEF' },
    Belt: { name: 'Utility Belt', icon: 'pi pi-tag', stats: '+5 Carry' },
    MainHand: { name: 'War Axe', icon: 'pi pi-server', stats: '+15 ATK' },
    OffHand: null,
    Gloves: { name: 'Gauntlets', icon: 'pi pi-box', stats: '+5 Dex' },
    Ring1: null,
    Ring2: { name: 'Signet Ring', icon: 'pi pi-circle-fill', stats: '+3 Haste' },
    Boots: { name: 'Leather Boots', icon: 'pi pi-send', stats: '+2 Mov' },
    Charm1: null,
    Charm2: { name: 'Fire Charm', icon: 'pi pi-heart-fill', stats: 'Immunity' },
    Charm3: null,
});

const equipmentSlots = computed(() => {
    return Object.keys(mockEquipment.value);
});

/** Helper function to determine the equipment icon for empty slots */
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

/** Helper function to get slot position (Uses User-Defined Coordinates) */
const getSlotPosition = (slot: string) => {
    switch (slot) {
        // --- Center Slots ---
        case 'Helm': return { top: '15%', left: '48%' };
        case 'Armor': return { top: '35%', left: '48%' };
        case 'Belt': return { top: '55%', left: '48%' };
        case 'Boots': return { top: '80%', left: '48%' };

        // --- Left Side Slots ---
        case 'MainHand': return { top: '40%', left: '30%' }; 
        case 'Gloves': return { top: '55%', left: '15%' };
        case 'Cape': return { top: '15%', left: '25%' }; 
        case 'Ring1': return { top: '65%', left: '30%' };

        // --- Right Side Slots ---
        case 'OffHand': return { top: '40%', right: '25%' }; 
        case 'Amulet': return { top: '15%', right: '20%' };
        case 'Ring2': return { top: '65%', right: '30%' };

        // --- Charm Slots ---
        case 'Charm1': return { top: '85%', right: '30%' }; 
        case 'Charm2': return { top: '85%', right: '20%' };
        case 'Charm3': return { top: '85%', right: '10%' };
        default: return { top: '50%', left: '50%' };
    }
};

// --- Context Menu State ---
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const activeSlot = ref<string | null>(null);

/** Opens the context menu on right-click */
const showContextMenu = (event: MouseEvent, slot: string) => {
    // Prevent the browser's default context menu from appearing
    event.preventDefault();
    
    // Only show the menu if an item is actually equipped
    if (!mockEquipment.value[slot]) {
        return;
    }

    // Set position and active slot
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    activeSlot.value = slot;
    contextMenuVisible.value = true;
};

/** Closes the context menu */
const hideContextMenu = () => {
    contextMenuVisible.value = false;
    activeSlot.value = null;
};

/** Action Handler */
const handleMenuAction = (action: 'unequip' | 'inspect') => {
    if (!activeSlot.value) return;

    if (action === 'unequip') {
        mockEquipment.value[activeSlot.value] = null;
        console.log(`Unequipped item from ${activeSlot.value}`);
    } else if (action === 'inspect') {
        console.log(`Inspecting item in ${activeSlot.value}`);
        // Actual implementation would open a modal/panel with item details
    }
    
    hideContextMenu();
};

// Global click listener to close the menu when clicking anywhere else
onMounted(() => {
    window.addEventListener('click', hideContextMenu);
});

onUnmounted(() => {
    window.removeEventListener('click', hideContextMenu);
});
</script>

<template>
    <div class="bg-surface-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Equipment</h3>
        
        <div class="relative w-full h-[450px] overflow-hidden">
            
            <svg class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70" 
                 width="120" height="350" viewBox="0 0 120 350" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="30" r="25" fill="#3f3f46"/>
                <rect x="35" y="55" width="50" height="150" rx="10" fill="#3f3f46"/>
                <path d="M85 75L110 95V150L85 130V75Z" fill="#3f3f46"/>
                <path d="M35 75L10 95V150L35 130V75Z" transform="scale(-1, 1) translate(-120, 0)" fill="#3f3f46"/>
                <rect x="40" y="200" width="40" height="150" rx="5" fill="#3f3f46"/>
            </svg>
            
            <div v-for="slot in equipmentSlots" :key="slot" 
                class="absolute text-center text-surface-500 transform -translate-x-1/2 -translate-y-1/2 z-10 group"
                :style="getSlotPosition(slot)"
            >
                <div @contextmenu="showContextMenu($event, slot)"
                    :class="[
                        'w-16 h-16 rounded-lg flex items-center justify-center p-1 relative transition-all duration-150 shadow-md cursor-pointer',
                        // Styles for Equipped vs. Empty Slots
                        mockEquipment[slot] 
                            ? 'bg-surface-700 border-2 border-primary-400 shadow-xl shadow-primary-500/30' // GLOW EFFECT
                            : 'bg-surface-800/80 border border-dashed border-surface-600 hover:border-surface-400'
                    ]">
                    <i v-if="!mockEquipment[slot]" :class="getEquipmentIcon(slot)" class="text-3xl text-surface-500"></i>
                    
                    <div v-else class="w-full h-full flex flex-col items-center justify-center">
                        <i :class="mockEquipment[slot].icon" class="text-3xl text-primary-400"></i>
                        <p class="text-xs text-surface-0 font-semibold">{{ mockEquipment[slot].name }}</p>
                    </div>
                </div>
                
                <p v-if="!mockEquipment[slot]" class="mt-2 text-xs font-semibold text-surface-400 opacity-80 group-hover:text-surface-0 transition-colors">{{ slot }}</p>

                <div class="absolute left-1/2 bottom-full mb-2 hidden group-hover:block w-max z-20 transform -translate-x-1/2
                            bg-surface-900 text-surface-200 text-xs rounded-md px-3 py-1 shadow-xl border border-primary-400">
                    <template v-if="mockEquipment[slot]">
                        <p class="font-bold text-primary-400">{{ mockEquipment[slot].name }}</p>
                        <p class="text-surface-200">{{ mockEquipment[slot].stats }}</p>
                    </template>
                    <template v-else>
                        <p class="text-surface-400 font-semibold">Empty Slot: {{ slot }}</p>
                        <p class="text-surface-500 italic">Click to equip item.</p>
                    </template>
                </div>
            </div>
            
        </div> 

        <div v-if="contextMenuVisible" 
             :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
             class="fixed bg-surface-700 rounded-lg shadow-2xl border border-surface-600 z-50 py-1 min-w-40"
        >
            <button 
                @click.stop="handleMenuAction('unequip')"
                class="w-full text-left px-3 py-1.5 text-surface-200 hover:bg-surface-600 transition-colors duration-100 flex items-center gap-2"
            >
                <i class="pi pi-times-circle text-red-400 text-sm"></i> Unequip
            </button>
            <button 
                @click.stop="handleMenuAction('inspect')"
                class="w-full text-left px-3 py-1.5 text-surface-200 hover:bg-surface-600 transition-colors duration-100 flex items-center gap-2"
            >
                <i class="pi pi-search text-sky-400 text-sm"></i> Inspect
            </button>
        </div>
        
    </div>
</template>
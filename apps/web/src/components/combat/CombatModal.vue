<script setup lang="ts">
import Dialog from '@/volt/Dialog.vue';
import Button from '@/volt/Button.vue';
import CombatantCard from './CombatantCard.vue';
import CombatBar from './CombatBar.vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { App } from 'mmolike_rpg-application';

const gameStore = useGameStore();
const { combat } = storeToRefs(gameStore);

// --- Component State ---
const isTargeting = ref(false);
const selectedTargets = ref<string[]>([]);

const isCombatActive = computed(() => combat.value !== null);

const activeCombatantId = computed(() => {
    if (!combat.value || !combat.value.turnQueue || combat.value.turnQueue.length === 0) {
        return null;
    }
    return combat.value.turnQueue[combat.value.currentTurnIndex];
});

const activeCombatant = computed(() => {
    if (!activeCombatantId.value || !combat.value) return null;
    return combat.value.combatants.find(c => String(c.id) === activeCombatantId.value);
});

const isPlayerTurn = computed(() => {
    return activeCombatant.value?.ControllableComponent?.isPlayer === true;
});


// --- Grid Logic ---
const TEAM_SIZE = 4;
const playerGrid = computed(() => {
    const grid: { front: any; back: any }[] = Array(TEAM_SIZE).fill(null).map(() => ({ front: null, back: null }));
    const playerTeam = combat.value?.combatants.filter(c => c.CombatantComponent.teamId === 'team1') || [];
    playerTeam.forEach((c, index) => {
        if (index < TEAM_SIZE) {
            if (c.CombatantComponent.row === 'Front') {
                grid[index].front = c;
            } else {
                grid[index].back = c;
            }
        }
    });
    return grid;
});

const enemyGrid = computed(() => {
    const grid: { front: any; back: any }[] = Array(TEAM_SIZE).fill(null).map(() => ({ front: null, back: null }));
    const enemyTeam = combat.value?.combatants.filter(c => c.CombatantComponent.teamId === 'team2') || [];
    enemyTeam.forEach((c, index) => {
        if (index < TEAM_SIZE) {
            if (c.CombatantComponent.row === 'Front') {
                grid[index].front = c;
            } else {
                grid[index].back = c;
            }
        }
    });
    return grid;
});

// --- Targeting Logic ---
const handleAction = (actionId: string) => {
    if (!combat.value || !activeCombatant.value) return;

    switch (actionId) {
        case 'attack':
            isTargeting.value = true;
            selectedTargets.value = [];
            break;
        case 'defend':
            App.commands.defend(combat.value.combatEntityId, activeCombatant.value.id);
            break;
        case 'flee':
            App.commands.flee(combat.value.combatEntityId, activeCombatant.value.id);
            break;
        // Handle other actions like 'skills', 'item' etc. here
    }
};

const handleSelectTarget = (targetId: string) => {
    if (!isTargeting.value) return;

    // For now, we only allow single targeting. This can be expanded later.
    selectedTargets.value = [targetId];
    
    // In a real scenario, you'd have a confirm button.
    // For now, we'll just confirm immediately.
    confirmAttack();
};

const confirmAttack = () => {
    if (selectedTargets.value.length === 0 || !activeCombatant.value || !combat.value) return;
    
    // The player's basic attack skill ID
    const attackSkillId = 'basic_attack';
    
    App.commands.performSkill(
        combat.value.combatEntityId,
        activeCombatant.value.id,
        attackSkillId,
        selectedTargets.value[0]
    );
    
    // Reset targeting state
    isTargeting.value = false;
    selectedTargets.value = [];
};

const cancelTargeting = () => {
    isTargeting.value = false;
    selectedTargets.value = [];
};

const doNothing = () => {};
</script>

<template>
    <Dialog
        :visible="isCombatActive"
        @update:visible="doNothing"
        :modal="true"
        :closable="false"
        header="Combat"
        class="w-full h-full"
        :pt="{
            root: 'max-h-full max-w-full border-none',
            header: 'hidden',
            content: 'p-0 bg-surface-900 h-full flex flex-col',
            mask: 'bg-black/80 z-40'
        }"
    >
        <div v-if="combat" class="h-full flex flex-col items-center justify-center p-4 bg-gray-800 bg-opacity-50 flex-grow relative">
            
            <!-- Targeting Overlay -->
            <div v-if="isTargeting" class="absolute inset-0 bg-black/50 z-20 flex items-start justify-center pt-8 pointer-events-none">
                <div class="bg-surface-800 p-4 rounded-lg shadow-xl border border-primary-500 pointer-events-auto">
                    <p class="text-lg font-bold text-primary-400">Select a target for Attack</p>
                    <Button label="Cancel" severity="danger" @click="cancelTargeting" class="mt-2" />
                </div>
            </div>

            <div class="grid grid-cols-5 gap-4 w-full max-w-5xl h-full">
                <!-- Player Side -->
                <div class="col-span-2 grid grid-cols-2 grid-rows-4 gap-y-2">
                    <template v-for="(row, i) in playerGrid" :key="`player-row-${i}`">
                        <div class="flex items-center justify-center">
                            <CombatantCard v-if="row.back" :combatant="row.back" :is-active="String(row.back.id) === activeCombatantId" />
                        </div>
                        <div class="flex items-center justify-center">
                            <CombatantCard v-if="row.front" :combatant="row.front" :is-active="String(row.front.id) === activeCombatantId" />
                        </div>
                    </template>
                </div>

                <!-- Spacer -->
                <div></div>

                <!-- Enemy Side -->
                <div class="col-span-2 grid grid-cols-2 grid-rows-4 gap-y-2">
                     <template v-for="(row, i) in enemyGrid" :key="`enemy-row-${i}`">
                        <div class="flex items-center justify-center">
                            <CombatantCard 
                                v-if="row.front" 
                                :combatant="row.front" 
                                :is-active="String(row.front.id) === activeCombatantId"
                                :is-targetable="isTargeting"
                                :is-targeted="selectedTargets.includes(String(row.front.id))"
                                @click="handleSelectTarget(String(row.front.id))"
                            />
                        </div>
                        <div class="flex items-center justify-center">
                            <CombatantCard 
                                v-if="row.back" 
                                :combatant="row.back" 
                                :is-active="String(row.back.id) === activeCombatantId"
                                :is-targetable="isTargeting"
                                :is-targeted="selectedTargets.includes(String(row.back.id))"
                                @click="handleSelectTarget(String(row.back.id))"
                            />
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <CombatBar v-if="isPlayerTurn" @action="handleAction" class="flex-shrink-0" />
    </Dialog>
</template>


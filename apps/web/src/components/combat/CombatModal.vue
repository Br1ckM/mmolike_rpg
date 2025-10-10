<script setup lang="ts">
import Dialog from '@/volt/Dialog.vue';
import Button from '@/volt/Button.vue';
import CombatantCard from './CombatantCard.vue';
import CombatBar from './CombatBar.vue';
import CombatSkillList from './CombatSkillList.vue';
import CombatItemBelt from './CombatItemBelt.vue';
import CombatEndScreen from './CombatEndScreen.vue';
import CombatVoreMenu from './CombatVoreMenu.vue'; // <-- NEW IMPORT
import { useGameStore } from '@/stores/game';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { App } from 'mmolike_rpg-application';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const { combat, combatLog, combatResult, denState } = storeToRefs(gameStore); // <-- Get denState
const { playerId } = storeToRefs(playerStore);

// --- State Management ---
const playerActionMode = ref<'idle' | 'selecting-skill' | 'selecting-item' | 'targeting' | 'vore-menu'>('idle'); // <-- ADD 'vore-menu'
const isSelectingSkill = computed(() => playerActionMode.value === 'selecting-skill');
const isSelectingItem = computed(() => playerActionMode.value === 'selecting-item');
const isVoreMenuOpen = computed(() => playerActionMode.value === 'vore-menu'); // <-- NEW
const isTargeting = computed(() => playerActionMode.value === 'targeting');

const selectedTargets = ref<string[]>([]);
const selectedSkillId = ref<string | null>(null);
const selectedBeltIndex = ref<number | null>(null);

const overlayTitle = computed(() => {
    if (playerActionMode.value === 'selecting-skill') {
        return 'Select a Skill';
    }
    if (playerActionMode.value === 'selecting-item') {
        return 'Select an Item';
    }
    if (playerActionMode.value === 'vore-menu') {
        return 'Vore Actions'; // <-- NEW TITLE
    }
    if (playerActionMode.value === 'targeting') {
        const skillName = activeCombatant.value?.SkillBookComponent.hydratedSkills.find((s: any) => s.id === selectedSkillId.value)?.name || 'action';
        return `Select a target for ${skillName}`;
    }
    return '';
});


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


// --- Grid Logic (Unchanged) ---
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

// --- Action & Targeting Logic ---

const handleAction = (actionId: string) => {
    if (!combat.value || !activeCombatant.value) return;

    playerActionMode.value = 'idle';

    switch (actionId) {
        case 'attack':
            selectedSkillId.value = 'basic_attack';
            playerActionMode.value = 'targeting';
            selectedTargets.value = [];
            break;
        case 'skills':
            playerActionMode.value = 'selecting-skill';
            break;
        case 'item':
            playerActionMode.value = 'selecting-item';
            break;
        case 'vore-menu': // <-- NEW CASE
            playerActionMode.value = 'vore-menu';
            break;
        case 'defend':
            App.commands.defend(combat.value.combatEntityId, String(activeCombatant.value.id));
            break;
        case 'flee':
            App.commands.flee(combat.value.combatEntityId, String(activeCombatant.value.id));
            break;
    }
};

// This function handles selection from the Vore Menu OR the Skill List
const onSkillSelected = (skill: any) => {
    selectedSkillId.value = skill.id;

    // Check if the action is purely internal (like Regurgitate/Heal Self) or requires a target
    if (skill.target === 'Self' || skill.id === 'skill_regurgitate') {
        // Regurgitate doesn't target another combatant, it just triggers the system action
        if (skill.id === 'skill_regurgitate') {
            // Note: The direct Regurgitate action is handled in CombatVoreMenu.vue now,
            // but we keep this flow for consistency if a skill list contained it.
        } else {
            selectedTargets.value = [String(activeCombatant.value.id)];
            confirmAction();
        }
    } else {
        playerActionMode.value = 'targeting';
        selectedTargets.value = [];
    }

    // If we're coming from the Vore Menu, this action should trigger targeting OR confirm immediately.
    if (playerActionMode.value === 'vore-menu') {
        playerActionMode.value = 'targeting';
    }
};

// Handles selection from the dedicated Vore menu (only sends Devour skill for targeting)
const onVoreActionSelected = (action: { id: string, name: string, target: string }) => {
    if (action.id === 'regurgitate') {
        // Regurgitate is handled entirely in CombatVoreMenu.vue (calling command directly)
        cancelSelection(); // Close the menu as action is complete
    } else {
        // Devour must select a target
        onSkillSelected({ id: action.id, name: action.name, target: action.target });
    }
}

const onItemInBeltSelected = ({ item, index }: { item: any; index: number }) => {
    if (!playerId.value || !combat.value) return;
    App.commands.useItemInBelt(playerId.value, index, combat.value.combatEntityId);
    cancelSelection();
};

const handleSelectTarget = (targetId: string) => {
    if (playerActionMode.value !== 'targeting') return;

    selectedTargets.value = [targetId];
    confirmAction();
};

const confirmAction = () => {
    if (selectedTargets.value.length === 0 || !activeCombatant.value || !combat.value || !selectedSkillId.value) return;

    App.commands.performSkill(
        combat.value.combatEntityId,
        String(activeCombatant.value.id),
        selectedSkillId.value,
        selectedTargets.value[0]
    );

    cancelSelection();
};

const cancelSelection = () => {
    playerActionMode.value = 'idle';
    selectedTargets.value = [];
    selectedSkillId.value = null;
    selectedBeltIndex.value = null;
};

const isStageComplete = (stageIndex: number) => {
    if (!denState.value) return false;
    return stageIndex < denState.value.currentStage;
};

const isStageActive = (stageIndex: number) => {
    if (!denState.value) return false;
    return stageIndex === denState.value.currentStage;
};

const doNothing = () => { };
</script>

<template>
    <Dialog :visible="isCombatActive" @update:visible="doNothing" :modal="true" :closable="false" header="Combat"
        class="w-full h-full" :pt="{
            root: 'max-h-full max-w-full border-none',
            header: 'hidden',
            content: 'p-0 bg-surface-900 h-full flex flex-col',
            mask: 'bg-black/80 z-40'
        }">

        <div v-if="denState && denState.status === 'IN_PROGRESS'"
            class="flex-shrink-0 bg-surface-800/90 text-white py-4 text-center border-b-2 border-primary-500">
            <h2 class="text-xl font-bold text-primary-400 mb-3">{{ denState.denName }}</h2>
            <div class="flex items-center justify-center">
                <template v-for="index in denState.totalStages" :key="index">
                    <div v-if="index > 1" class="w-6 h-1 transition-colors duration-500"
                        :class="isStageActive(index - 1) || isStageComplete(index - 1) ? 'bg-primary-400' : 'bg-surface-600'">
                    </div>
                    <div class="w-8 h-8 flex items-center justify-center rounded border-2 transition-colors duration-500"
                        :class="{
                            'bg-primary-500 border-primary-300 shadow-lg shadow-primary-500/30': isStageActive(index - 1),
                            'bg-green-600 border-green-400': isStageComplete(index - 1),
                            'bg-surface-700 border-surface-600': !isStageActive(index - 1) && !isStageComplete(index - 1)
                        }">
                        <i v-if="isStageComplete(index - 1)" class="pi pi-check text-white"></i>
                        <i v-else-if="isStageActive(index - 1)" class="pi pi-bolt text-yellow-300 animate-pulse"></i>
                    </div>
                </template>
            </div>
        </div>

        <div v-if="combat"
            class="h-full flex flex-col items-center justify-center p-4 bg-gray-800 bg-opacity-50 flex-grow relative">

            <CombatEndScreen v-if="combatResult" :result="combatResult" @close="gameStore.clearCombatState()" />

            <div v-if="playerActionMode !== 'idle'"
                class="absolute inset-0 bg-black/50 z-20 flex items-center justify-center pointer-events-none">
                <div
                    class="bg-surface-800 p-4 rounded-lg shadow-xl border border-primary-500 pointer-events-auto max-w-lg w-full">
                    <p class="text-lg font-bold text-primary-400 text-center mb-4">{{ overlayTitle }}</p>

                    <!-- Skill Selection (default) -->
                    <CombatSkillList v-if="isSelectingSkill && activeCombatant"
                        :skills="activeCombatant.SkillBookComponent.hydratedSkills" :caster="activeCombatant"
                        @select="onSkillSelected" />

                    <!-- Vore Menu Selection (new) -->
                    <CombatVoreMenu v-else-if="isVoreMenuOpen" @select-action="onSkillSelected" />

                    <!-- Item Selection -->
                    <CombatItemBelt v-else-if="isSelectingItem" @select-item="onItemInBeltSelected" />

                    <!-- Target Selection (no list here, targets are selected in the main grid) -->
                    <div v-else-if="isTargeting" class="text-center text-surface-400 p-4">
                        Click on an enemy to select them as your target.
                    </div>


                    <Button label="Cancel" severity="danger" @click="cancelSelection" class="mt-4 w-full" />
                </div>
            </div>

            <div class="grid grid-cols-5 gap-4 w-full max-w-5xl h-full">
                <div class="col-span-2 grid grid-cols-2 grid-rows-4 gap-y-2">
                    <template v-for="(row, i) in playerGrid" :key="`player-row-${i}`">
                        <div class="flex items-center justify-center">
                            <CombatantCard v-if="row.back" :combatant="row.back"
                                :is-active="String(row.back.id) === activeCombatantId" :combat-log="combatLog" />
                        </div>
                        <div class="flex items-center justify-center">
                            <CombatantCard v-if="row.front" :combatant="row.front"
                                :is-active="String(row.front.id) === activeCombatantId" :combat-log="combatLog" />
                        </div>
                    </template>
                </div>

                <div></div>

                <div class="col-span-2 grid grid-cols-2 grid-rows-4 gap-y-2">
                    <template v-for="(row, i) in enemyGrid" :key="`enemy-row-${i}`">
                        <div class="flex items-center justify-center">
                            <CombatantCard v-if="row.front" :combatant="row.front"
                                :is-active="String(row.front.id) === activeCombatantId" :is-targetable="isTargeting"
                                :is-targeted="selectedTargets.includes(String(row.front.id))" :combat-log="combatLog"
                                @click="handleSelectTarget(String(row.front.id))" />
                        </div>
                        <div class="flex items-center justify-center">
                            <CombatantCard v-if="row.back" :combatant="row.back"
                                :is-active="String(row.back.id) === activeCombatantId" :is-targetable="isTargeting"
                                :is-targeted="selectedTargets.includes(String(row.back.id))" :combat-log="combatLog"
                                @click="handleSelectTarget(String(row.back.id))" />
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <CombatBar v-if="isPlayerTurn" @action="handleAction" class="flex-shrink-0" />
    </Dialog>
</template>

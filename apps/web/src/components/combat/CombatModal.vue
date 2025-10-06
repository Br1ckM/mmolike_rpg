<script setup lang="ts">
import Dialog from '@/volt/Dialog.vue';
import Button from '@/volt/Button.vue';
import CombatantCard from './CombatantCard.vue';
import CombatBar from './CombatBar.vue';
import CombatSkillList from './CombatSkillList.vue';
import { useGameStore } from '@/stores/game';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { App } from 'mmolike_rpg-application';

const gameStore = useGameStore();
const { combat, combatLog } = storeToRefs(gameStore);

// --- State Management ---
const playerActionMode = ref<'idle' | 'selecting-skill' | 'targeting'>('idle');
const isSelectingSkill = computed(() => playerActionMode.value === 'selecting-skill');
const isTargeting = computed(() => playerActionMode.value === 'targeting');

const selectedTargets = ref<string[]>([]);
const selectedSkillId = ref<string | null>(null);

const overlayTitle = computed(() => {
    if (playerActionMode.value === 'selecting-skill') {
        return 'Select a Skill';
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
        case 'defend':
            App.commands.defend(combat.value.combatEntityId, String(activeCombatant.value.id));
            break;
        case 'flee':
            App.commands.flee(combat.value.combatEntityId, String(activeCombatant.value.id));
            break;
    }
};

const onSkillSelected = (skill: any) => {
    selectedSkillId.value = skill.id;

    if (skill.target === 'Self') {
        selectedTargets.value = [String(activeCombatant.value.id)];
        confirmAction();
    } else {
        playerActionMode.value = 'targeting';
        selectedTargets.value = [];
    }
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
        <div v-if="combat"
            class="h-full flex flex-col items-center justify-center p-4 bg-gray-800 bg-opacity-50 flex-grow relative">

            <!-- Overlays -->
            <div v-if="playerActionMode !== 'idle'"
                class="absolute inset-0 bg-black/50 z-20 flex items-center justify-center pointer-events-none">
                <div
                    class="bg-surface-800 p-4 rounded-lg shadow-xl border border-primary-500 pointer-events-auto max-w-lg w-full">
                    <p class="text-lg font-bold text-primary-400 text-center mb-4">{{ overlayTitle }}</p>

                    <CombatSkillList v-if="isSelectingSkill && activeCombatant"
                        :skills="activeCombatant.SkillBookComponent.hydratedSkills" :caster="activeCombatant"
                        @select="onSkillSelected" />

                    <Button label="Cancel" severity="danger" @click="cancelSelection" class="mt-4 w-full" />
                </div>
            </div>

            <div class="grid grid-cols-5 gap-4 w-full max-w-5xl h-full">
                <!-- Player Side -->
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

                <!-- Spacer -->
                <div></div>

                <!-- Enemy Side -->
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

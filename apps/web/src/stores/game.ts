import { defineStore } from 'pinia';
import { ref } from 'vue';
import { App } from 'mmolike_rpg-application/core';

interface HistoryEntry {
    speaker: 'NPC' | 'Player';
    text: string;
}
interface DialogueState {
    npcName: string;
    npcImage: string;
    text: string;
    responses: any[];
    history: HistoryEntry[];
}

interface CombatState {
    combatEntityId: string;
    combatants: any[];
    turnQueue: string[];
    currentTurnIndex: number;
    roundNumber: number;
}

interface CombatLogEvent {
    id: number;
    targetId: string;
    amount: number;
    type: 'damage' | 'heal' | 'crit';
}

interface CombatResult {
    winningTeamId: string;
}

// --- NEW TYPES ---
interface VendorItem {
    id: number;
    name: string;
    cost: number;
    icon: string;
}

interface TrainerSkill {
    id: string;
    name: string;
    cost: number;
    description: string;
}



export const useGameStore = defineStore('game', () => {
    const timeOfDay = ref<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning'); // <-- NEW STATE
    const dialogue = ref<DialogueState | null>(null);
    const combat = ref<CombatState | null>(null);
    const combatResult = ref<CombatResult | null>(null);
    const notifications = ref<{ message: string; type: string }[]>([]);
    const combatLog = ref<CombatLogEvent[]>([]);
    const notificationUnsubscribe = ref<(() => void) | null>(null);
    const dialogueUnsubscribe = ref<(() => void) | null>(null);
    const combatUnsubscribe = ref<(() => void) | null>(null);
    const combatResultUnsubscribe = ref<(() => void) | null>(null);
    const activeService = ref<'Shop' | 'Trainer' | null>(null);
    const playerLeveledUpUnsubscribe = ref<(() => void) | null>(null);
    const timeOfDayUnsubscribe = ref<(() => void) | null>(null);

    // --- NEW STATE ---
    const vendorItems = ref<VendorItem[]>([]);
    const trainerSkills = ref<TrainerSkill[]>([]);
    const vendorUnsubscribe = ref<(() => void) | null>(null);
    const denState = ref<{ denId: string; denName: string; currentStage: number; totalStages: number; status?: string } | null>(null);


    async function initialize() {
        await App.isReady;

        // Prefer domain-level GameService when available
        const gameSvc: any = App.getService && App.getService('GameService');

        if (gameSvc && typeof gameSvc.subscribe === 'function') {
            // Use GameService subscription API
            gameSvc.subscribe('denState', (newState: any) => {
                denState.value = newState;
            });

            gameSvc.subscribe('combatEnded', () => {
                setTimeout(() => denState.value = null, 3000);
            });

            timeOfDayUnsubscribe.value = gameSvc.subscribe('timeOfDayChanged', (payload: { newTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night' }) => {
                if (payload) {
                    timeOfDay.value = payload.newTime;
                }
            });
        } else {
            App.queries.subscribe<any>('denState', (newState: any) => {
                denState.value = newState;
            });

            App.queries.subscribe('combatEnded', () => {
                setTimeout(() => denState.value = null, 3000); // Clear after a delay
            });

            timeOfDayUnsubscribe.value = App.queries.subscribe<{ newTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night' }>('timeOfDayChanged', (payload: { newTime: 'Morning' | 'Afternoon' | 'Evening' | 'Night' } | null) => {
                if (payload) {
                    timeOfDay.value = payload.newTime;
                }
            });
        }

        dialogueUnsubscribe.value = (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('dialogueState', (newDialogueData: any) => {
            if (newDialogueData) {
                dialogue.value = {
                    npcName: newDialogueData.npcName,
                    npcImage: newDialogueData.npcAvatarUrl,
                    text: newDialogueData.text,
                    responses: newDialogueData.responses,
                    history: newDialogueData.history
                };
                activeService.value = null;
            } else {
                dialogue.value = null;
            }
        }) : App.queries.subscribe('dialogueState', (newDialogueData: any) => {
            if (newDialogueData) {
                dialogue.value = {
                    npcName: newDialogueData.npcName,
                    npcImage: newDialogueData.npcAvatarUrl,
                    text: newDialogueData.text,
                    responses: newDialogueData.responses,
                    history: newDialogueData.history
                };
                activeService.value = null;
            } else {
                dialogue.value = null;
            }
        }));

        (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('vendorScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Shop';
        }) : App.queries.subscribe('vendorScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Shop';
        }));

        (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('trainingScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Trainer';
            // Placeholder data until TrainerSystem is fully implemented
            trainerSkills.value = [
                { id: 'skill_power_strike', name: 'Power Strike', cost: 100, description: 'A powerful overhead swing.' },
                { id: 'skill_fortify', name: 'Fortify', cost: 250, description: 'Temporarily increases defense.' },
            ];
        }) : App.queries.subscribe('trainingScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Trainer';
            // Placeholder data until TrainerSystem is fully implemented
            trainerSkills.value = [
                { id: 'skill_power_strike', name: 'Power Strike', cost: 100, description: 'A powerful overhead swing.' },
                { id: 'skill_fortify', name: 'Fortify', cost: 250, description: 'Temporarily increases defense.' },
            ];
        }));

        // --- NEW SUBSCRIPTION ---
        vendorUnsubscribe.value = (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('vendorInventoryUpdated', (payload: any) => {
            vendorItems.value = payload.vendorItems;
        }) : App.queries.subscribe<any>('vendorInventoryUpdated', (payload: any) => {
            vendorItems.value = payload.vendorItems;
        }));

        combatUnsubscribe.value = (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('combatState', (newCombatState: CombatState) => {
            combat.value = newCombatState;
            if (newCombatState) {
                // Reset result when new combat starts
                combatResult.value = null;
            }
        }) : App.queries.subscribe<CombatState>('combatState', (newCombatState: CombatState | null) => {
            combat.value = newCombatState;
            if (newCombatState) {
                combatResult.value = null;
            }
        }));

        combatResultUnsubscribe.value = (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('combatResult', (result: CombatResult) => {
            combatResult.value = result;
        }) : App.queries.subscribe<CombatResult>('combatResult', (result: CombatResult | null) => {
            combatResult.value = result;
        }));

        playerLeveledUpUnsubscribe.value = (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('playerLeveledUp', ({ newLevel }: { newLevel: number }) => {
            notifications.value.push({
                type: 'success',
                message: `Congratulations! You have reached Level ${newLevel}!`,
            });
        }) : App.queries.subscribe<{ newLevel: number }>('playerLeveledUp', ({ newLevel }: { newLevel: number }) => {
            notifications.value.push({
                type: 'success',
                message: `Congratulations! You have reached Level ${newLevel}!`,
            });
        }));

        notificationUnsubscribe.value = (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('notification', (notification: { message: string, type: string }) => {
            notifications.value.push(notification);
            if (notifications.value.length > 5) {
                notifications.value.shift();
            }
        }) : App.queries.subscribe<{ message: string, type: string }>('notification', (notification: { message: string, type: string }) => {
            notifications.value.push(notification);
            if (notifications.value.length > 5) {
                notifications.value.shift();
            }
        }));

        (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('damageDealt', (payload: { targetId: string; damage: number, isCritical: boolean }) => {
            const event: CombatLogEvent = {
                id: Date.now() + Math.random(),
                targetId: payload.targetId,
                amount: payload.damage,
                type: payload.isCritical ? 'crit' : 'damage',
            };
            combatLog.value.push(event);
            setTimeout(() => {
                combatLog.value = combatLog.value.filter(e => e.id !== event.id);
            }, 1500);
        }) : App.queries.subscribe('damageDealt', (payload: { targetId: string; damage: number, isCritical: boolean }) => {
            const event: CombatLogEvent = {
                id: Date.now() + Math.random(),
                targetId: payload.targetId,
                amount: payload.damage,
                type: payload.isCritical ? 'crit' : 'damage',
            };
            combatLog.value.push(event);
            setTimeout(() => {
                combatLog.value = combatLog.value.filter(e => e.id !== event.id);
            }, 1500);
        }));

        (gameSvc && typeof gameSvc.subscribe === 'function' ? gameSvc.subscribe('healthHealed', (payload: { targetId: string; amount: number }) => {
            const event: CombatLogEvent = {
                id: Date.now() + Math.random(),
                targetId: payload.targetId,
                amount: payload.amount,
                type: 'heal',
            };
            combatLog.value.push(event);
            setTimeout(() => {
                combatLog.value = combatLog.value.filter(e => e.id !== event.id);
            }, 1500);
        }) : App.queries.subscribe('healthHealed', (payload: { targetId: string; amount: number }) => {
            const event: CombatLogEvent = {
                id: Date.now() + Math.random(),
                targetId: payload.targetId,
                amount: payload.amount,
                type: 'heal',
            };
            combatLog.value.push(event);
            setTimeout(() => {
                combatLog.value = combatLog.value.filter(e => e.id !== event.id);
            }, 1500);
        }));
    }

    function selectDialogueResponse(index: number) {
        const gameSvc: any = App.getService && App.getService('GameService');
        if (gameSvc && typeof gameSvc.selectDialogueResponse === 'function') {
            gameSvc.selectDialogueResponse(index);
            return;
        }
        App.commands.selectDialogueResponse(index);
    }

    function clearActiveService() {
        activeService.value = null;
    }

    function clearCombatState() {
        combat.value = null;
        combatResult.value = null;
        denState.value = null;
        combatLog.value = [];
    }

    function clearDenState() {
        denState.value = null;
    }

    return {
        timeOfDay,
        dialogue,
        combat,
        notifications,
        combatLog,
        activeService,
        combatResult,
        vendorItems, // <-- EXPORT
        trainerSkills, // <-- EXPORT
        initialize,
        selectDialogueResponse,
        clearActiveService,
        clearCombatState,
        denState,
        clearDenState,
    };
});
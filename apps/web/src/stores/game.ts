import { defineStore } from 'pinia';
import { ref } from 'vue';
import { App } from 'mmolike_rpg-application';

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


export const useGameStore = defineStore('game', () => {
    const dialogue = ref<DialogueState | null>(null);
    const combat = ref<CombatState | null>(null);
    const notifications = ref<{ message: string; type: string }[]>([]);
    const combatLog = ref<CombatLogEvent[]>([]);
    const notificationUnsubscribe = ref<(() => void) | null>(null);
    const dialogueUnsubscribe = ref<(() => void) | null>(null);
    const combatUnsubscribe = ref<(() => void) | null>(null);
    const activeService = ref<'Shop' | 'Trainer' | null>(null);

    async function initialize() {
        await App.isReady;

        dialogueUnsubscribe.value = App.queries.subscribe<any>('dialogueState', (newDialogueData) => {
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
        });

        App.queries.subscribe('vendorScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Shop';
        });

        App.queries.subscribe('trainingScreenOpened', () => {
            dialogue.value = null;
            activeService.value = 'Trainer';
        });

        combatUnsubscribe.value = App.queries.subscribe<CombatState>('combatState', (newCombatState) => {
            combat.value = newCombatState;
        });

        notificationUnsubscribe.value = App.queries.subscribe<{ message: string, type: string }>('notification', (notification) => {
            notifications.value.push(notification);
            if (notifications.value.length > 5) {
                notifications.value.shift();
            }
        });

        App.queries.subscribe('damageDealt', (payload: { targetId: string; damage: number, isCritical: boolean }) => {
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
        });

        App.queries.subscribe('healthHealed', (payload: { targetId: string; amount: number }) => {
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
        });
    }

    function selectDialogueResponse(index: number) {
        App.commands.selectDialogueResponse(index);
    }

    function clearActiveService() {
        activeService.value = null;
    }


    return {
        dialogue,
        combat,
        notifications,
        combatLog,
        activeService,
        initialize,
        selectDialogueResponse,
        clearActiveService
    };
});


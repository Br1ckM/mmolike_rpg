<script setup lang="ts">
import Dialog from '@/volt/Dialog.vue';
import Button from '@/volt/Button.vue';
import Avatar from '@/volt/Avatar.vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const playerStore = usePlayerStore();
const { itemToInspect, isInspectorOpen } = storeToRefs(playerStore);

const totalStats = computed(() => {
    if (!itemToInspect.value) return {};
    const stats: { [key: string]: number } = {};

    for (const [key, value] of Object.entries(itemToInspect.value.baseStats || {})) {
        stats[key] = (stats[key] || 0) + value;
    }

    for (const affix of (itemToInspect.value.affixes || [])) {
        for (const effect of affix.effects) {
            stats[effect.stat] = (stats[effect.stat] || 0) + effect.value;
        }
    }
    return stats;
});

const blockInternalClose = () => { };

const getQualityColor = (quality: string) => {
    switch (quality) {
        case 'Junk': return 'text-surface-400 border-surface-600';
        case 'Common': return 'text-surface-200 border-surface-400';
        case 'Uncommon': return 'text-primary-400 border-primary-500';
        case 'Rare': return 'text-sky-400 border-sky-500';
        case 'Epic': return 'text-purple-400 border-purple-500';
        case 'Legendary': return 'text-yellow-400 border-yellow-500';
        default: return 'text-surface-300 border-surface-600';
    }
};

const getModSlotColor = (status: 'empty' | 'filled') => {
    return status === 'filled'
        ? 'bg-primary-600 border-primary-400 text-surface-900'
        : 'bg-surface-700 border-surface-600 text-surface-400';
};
</script>

<template>
    <Dialog v-model:visible="isInspectorOpen" @update:visible="blockInternalClose" :modal="true" :closable="false"
        header="Item Inspector" class="w-11/12 md:w-3/4 lg:w-2/3" :pt="{
            root: 'max-h-[90%] overflow-visible z-50',
            header: 'hidden',
            content: '!flex p-0 h-full overflow-visible rounded-xl',
            mask: 'bg-black/80 z-40'
        }">
        <div v-if="itemToInspect" class="relative h-full w-full">

            <div
                class="absolute top-4 -left-44 w-52 p-4 bg-surface-800 rounded-lg shadow-xl border border-surface-700 z-10 hidden md:block">
                <h4 class="text-lg font-semibold text-surface-0 mb-2 border-b border-surface-700 pb-1">Total Stats</h4>
                <div class="space-y-1 text-sm text-surface-200">
                    <p v-for="(value, key) in totalStats" :key="key">
                        <span class="text-primary-400 font-bold">+{{ value }}</span> {{ key }}
                    </p>
                    <p v-if="!Object.keys(totalStats).length" class="text-surface-400 italic">No stats</p>
                </div>
            </div>

            <div class="relative bg-surface-900 rounded-xl shadow-2xl flex flex-col h-full z-20">
                <div class="relative p-6 flex-grow overflow-y-auto">
                    <div class="flex items-center justify-between border-b border-surface-700 pb-3 mb-4">
                        <h2 class="text-3xl font-bold" :class="getQualityColor(itemToInspect.quality).split(' ')[0]">{{
                            itemToInspect.name }}</h2>
                        <div class="text-right">
                            <p class="text-sm italic" :class="getQualityColor(itemToInspect.quality).split(' ')[0]">{{
                                itemToInspect.quality }}</p>
                            <p class="text-surface-300 font-semibold">Item Lvl {{ itemToInspect.itemLevel }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 class="text-xl font-semibold text-surface-0 mb-3">Base Stats</h3>
                            <div v-for="(value, key) in itemToInspect.baseStats" :key="key"
                                class="flex justify-between text-surface-300">
                                <span class="capitalize">{{ key }}</span>
                                <span class="font-mono text-primary-300">{{ value }}</span>
                            </div>
                            <p v-if="!Object.keys(itemToInspect.baseStats || {}).length"
                                class="text-surface-400 italic">No
                                base stats.</p>


                            <h3 class="text-xl font-semibold text-surface-0 mt-6 mb-3">Affixes</h3>
                            <div v-if="itemToInspect.affixes && itemToInspect.affixes.length > 0">
                                <div v-for="affix in itemToInspect.affixes" :key="affix.name" class="text-sky-300">
                                    {{ affix.name }}
                                    <span v-for="effect in affix.effects" :key="effect.stat"
                                        class="text-surface-400 ml-2 italic capitalize">
                                        (+{{ effect.value }} {{ effect.stat }})
                                    </span>
                                </div>
                            </div>
                            <p v-else class="text-surface-400 italic">No affixes.</p>
                        </div>

                        <div>
                            <h3 class="text-xl font-semibold text-surface-0 mb-3">Mod Slots ({{
                                itemToInspect.modSlotsCount
                                || 0 }} Total)</h3>
                            <div v-if="itemToInspect.modSlotsCount" class="grid grid-cols-4 gap-3">
                                <div v-for="(slotStatus, index) in itemToInspect.modSlots" :key="index"
                                    :class="['w-16 h-16 rounded-lg border-2 flex items-center justify-center cursor-pointer', getModSlotColor(slotStatus)]">
                                    <span v-if="slotStatus === 'filled'" class="font-bold text-lg">MOD</span>
                                    <i v-else class="pi pi-plus text-2xl"></i>
                                </div>
                            </div>
                            <p v-if="itemToInspect.modSlotsCount" class="text-surface-500 text-xs italic mt-4">Click an
                                empty slot to insert a Mod.</p>
                            <p v-else class="text-surface-400 italic">No mod slots.</p>
                        </div>
                    </div>
                </div>
                <div
                    class="mt-auto border-t border-surface-700 pt-4 flex justify-end gap-3 p-6 flex-shrink-0 bg-surface-900 sticky bottom-0">
                    <Button label="Close" severity="secondary" @click="playerStore.closeInspector()" />
                    <Button label="Equip Item" icon="pi pi-user" />
                </div>
            </div>
        </div>
    </Dialog>
</template>
// src/components/character/CharacterIdentityAndStats.vue

<script setup lang="ts">
import Avatar from '@/volt/Avatar.vue';
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';
import { ref, computed } from 'vue';

const playerStore = usePlayerStore();
const {
    player,
    healthPercentage,
    healthValues,
    manaPercentage,
    manaValues,
    experience
} = storeToRefs(playerStore);

const coreTiles = computed<Record<'STR' | 'DEX' | 'INT', number>>(() => ({
    STR: player.value?.coreStats?.strength ?? 0,
    DEX: player.value?.coreStats?.dexterity ?? 0,
    INT: player.value?.coreStats?.intelligence ?? 0,
}));

type DerivedKey = | 'attack' | 'magicAttack' | 'defense' | 'magicResist' | 'critChance' | 'critDamage' | 'dodge' | 'haste' | 'accuracy';

const DERIVED_META: Record<DerivedKey, { label: string; icon: string; tooltip: string; isPercent?: boolean }> = {
    attack: { label: 'Attack', icon: 'pi pi-bolt', tooltip: 'From STR, gear, and modifiers.' },
    magicAttack: { label: 'Magic Attack', icon: 'pi pi-star', tooltip: 'From INT, gear, and modifiers.' },
    defense: { label: 'Defense', icon: 'pi pi-shield', tooltip: 'From DEX/armor and modifiers.' },
    magicResist: { label: 'Magic Resist', icon: 'pi pi-flag', tooltip: 'Resistance against magic.' },
    critChance: { label: 'Crit Chance', icon: 'pi pi-bullseye', tooltip: 'Chance to crit.', isPercent: true },
    critDamage: { label: 'Crit Damage', icon: 'pi pi-plus-circle', tooltip: 'Crit damage multiplier.', isPercent: true },
    dodge: { label: 'Dodge', icon: 'pi pi-times-circle', tooltip: 'Chance to evade attacks.', isPercent: true },
    haste: { label: 'Haste', icon: 'pi pi-forward', tooltip: 'Attack/spell speed bonus.', isPercent: true },
    accuracy: { label: 'Accuracy', icon: 'pi pi-check', tooltip: 'Chance to hit.', isPercent: true },
}

const derivedList = computed(() => {
    const ds = player.value?.derivedStats ?? {} as Record<DerivedKey, number>;
    return (Object.keys(DERIVED_META) as DerivedKey[]).map((key) => {
        const meta = DERIVED_META[key];
        const raw = Number.isFinite(ds[key]) ? ds[key] : 0;
        const value = meta.isPercent ? `${Math.round(raw)}%` : Math.round(raw);
        return { name: meta.label, icon: meta.icon, tooltip: meta.tooltip, value };
    });
});

/** Helper function to return tile styling based on stat name */
const getStatTileStyles = (statName: string) => {
    switch (statName) {
        case 'STR':
            return { color: 'text-red-700', bg: 'bg-red-100', valueClass: 'text-red-950' };
        case 'DEX':
            return { color: 'text-green-700', bg: 'bg-green-100', valueClass: 'text-green-950' };
        case 'INT':
            return { color: 'text-sky-700', bg: 'bg-sky-100', valueClass: 'text-sky-950' };
        default:
            return { color: 'text-surface-700', bg: 'bg-surface-300', valueClass: 'text-surface-950' };
    }
};
</script>

<template>
    <div>
        <div class="flex gap-8 mb-8">

            <div class="flex flex-col items-center flex-shrink-0">
                <Avatar image="https://placehold.co/150x150/27272a/eab308?text=A" size="xlarge" shape="circle" />
                <p class="font-bold text-2xl mt-3 text-primary-400">{{ player?.name ?? 'Aethelred' }}</p>
                <p class="text-surface-400 text-sm mb-2">The Bold</p>
                <p class="text-surface-400 text-sm">Level {{ experience.level }} Knight</p>
            </div>

            <div class="flex flex-grow gap-8">

                <div class="w-1/2 flex-shrink-0">
                    <h3 class="text-xl font-semibold text-surface-0 mb-3">Core Stats</h3>
                    <div class="grid grid-cols-3 gap-3">
                        <div v-for="(value, name) in coreTiles" :key="name" :class="[
                            'border-2 rounded-lg p-3 text-center transition-shadow duration-150',
                            'border-surface-700 shadow-md', // Dark border with shadow
                            getStatTileStyles(name).bg // Light background
                        ]">
                            <p class="font-bold uppercase text-sm" :class="getStatTileStyles(name).color">{{ name }}</p>
                            <p class="font-mono text-3xl font-bold" :class="getStatTileStyles(name).valueClass">{{ value
                                }}</p>
                        </div>
                    </div>
                </div>

                <div class="w-full">
                    <h3 class="text-xl font-semibold text-surface-0 mb-3">Resources</h3>

                    <div class="mb-5">
                        <div class="flex items-center justify-between mb-1 text-sm">
                            <label class="block font-semibold text-surface-0">Health</label>
                            <span class="font-mono text-green-400">{{ healthValues.display ?? '0 / 0' }}</span>
                        </div>
                        <div class="bg-surface-700 rounded-full h-4 overflow-hidden">
                            <div class="h-full bg-green-500 transition-width duration-300 ease-in-out"
                                :style="{ width: (healthPercentage ?? 0) + '%' }"></div>
                        </div>
                    </div>

                    <div class="mb-5">
                        <div class="flex items-center justify-between mb-1 text-sm">
                            <label class="block font-semibold text-surface-0">Mana</label>
                            <span class="font-mono text-sky-400">{{ manaValues.display ?? '0 / 0' }}</span>
                        </div>
                        <div class="bg-surface-700 rounded-full h-4 overflow-hidden">
                            <div class="h-full bg-sky-400 transition-width duration-300 ease-in-out"
                                :style="{ width: (manaPercentage ?? 0) + '%' }"></div>
                        </div>
                    </div>

                    <div class="mb-5">
                        <div class="flex items-center justify-between mb-1 text-sm">
                            <label class="block font-semibold text-surface-0">Experience</label>
                            <span class="font-mono text-amber-400">{{ experience.display }}</span>
                        </div>
                        <div class="bg-surface-700 rounded-full h-4 overflow-hidden">
                            <div class="h-full bg-amber-500 transition-width duration-300 ease-in-out"
                                :style="{ width: experience.percentage + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-surface-800 rounded-lg shadow-lg p-6 mb-8">
            <h3 class="text-xl font-semibold text-surface-0 mb-4 border-b border-surface-700 pb-2">Derived Stats</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="stat in derivedList" :key="stat.name"
                    class="bg-surface-700 border border-surface-600 rounded-lg p-3 text-center transition-shadow duration-150 relative group shadow-md">
                    <div class="flex items-center justify-center gap-2 mb-1">
                        <i :class="stat.icon" class="text-primary-400 text-base"></i>
                        <span class="text-surface-200 font-semibold text-sm">{{ stat.name }}</span>
                    </div>

                    <span class="font-mono text-xl font-bold text-surface-0">{{ stat.value }}</span>

                    <div
                        class="absolute right-0 bottom-full mb-2 hidden group-hover:block w-max max-w-xs z-20 
                                bg-surface-900 text-surface-200 text-xs rounded-md px-3 py-2 shadow-xl border border-surface-700 transform translate-x-1/4">
                        {{ stat.tooltip }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
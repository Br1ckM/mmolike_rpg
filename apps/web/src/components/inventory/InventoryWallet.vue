// src/components/inventory/InventoryWallet.vue

<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import { storeToRefs } from 'pinia';

const playerStore = usePlayerStore();
const { wallet } = storeToRefs(playerStore);
</script>

<template>
    <div>
        <h3 class="text-xl font-semibold mb-3 border-b border-surface-700 pb-2 flex items-center gap-2">
            <i class="pi pi-wallet text-primary-400"></i> Wallet
        </h3>
        
        <div class="space-y-2 text-surface-300">
            <div v-for="(amount, currency) in wallet" :key="currency" class="flex justify-between items-center p-2 bg-surface-700 rounded-md">
                <span class="font-semibold">{{ currency }}</span>
                <span class="font-mono text-lg text-primary-300">{{ amount }}</span>
            </div>
        </div>
    </div>
</template>
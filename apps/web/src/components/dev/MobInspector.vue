<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ContentService } from 'mmolike_rpg-domain/ContentService';
import { GameService } from 'mmolike_rpg-application/GameService';
import { EventBus } from 'mmolike_rpg-domain/ecs/EventBus';

// Import content used by the Simulator (kept aligned with Simulator.vue)
import affixes from 'mmolike_rpg-content/affixes.yaml';
import archetypes from 'mmolike_rpg-content/archetypes.yaml';
import baseItems from 'mmolike_rpg-content/items/base-items.yaml';
import collectibles from 'mmolike_rpg-content/items/collectibles.yaml';
import consumables from 'mmolike_rpg-content/items/consumables.yaml';
import dialogueTrees from 'mmolike_rpg-content/dialogue.yaml';
import effects from 'mmolike_rpg-content/effects.yaml';
import encounters from 'mmolike_rpg-content/encounters.yaml';
import families from 'mmolike_rpg-content/families.yaml';
import inventories from 'mmolike_rpg-content/items/inventories.yaml';
import jobs from 'mmolike_rpg-content/jobs.yaml';
import locations from 'mmolike_rpg-content/locations.yaml';
import lootTables from 'mmolike_rpg-content/loot_table.yaml';
import misc from 'mmolike_rpg-content/items/misc.yaml';
import mobs from 'mmolike_rpg-content/characters/mobs.yaml';
import mods from 'mmolike_rpg-content/items/mods.yaml';
import nodes from 'mmolike_rpg-content/nodes.yaml';
import npcs from 'mmolike_rpg-content/characters/npcs.yaml';
import playerTemplate from 'mmolike_rpg-content/characters/player-template.yaml';
import questItems from 'mmolike_rpg-content/items/quest-items.yaml';
import quests from 'mmolike_rpg-content/quests.yaml';
import reagants from 'mmolike_rpg-content/items/reagants.yaml';
import skills from 'mmolike_rpg-content/skills.yaml';
import tiers from 'mmolike_rpg-content/tiers.yaml';
import traits from 'mmolike_rpg-content/traits.yaml';
import spawnPools from 'mmolike_rpg-content/spawn_pools.yaml';
import config from 'mmolike_rpg-content/config.yaml';

const protoId = ref<string>('');
const level = ref<number>(1);
const preview = ref<any>(null);
const isLoading = ref(false);

let gameService: GameService | null = null;

function buildContentService() {
    const combinedBaseItemsArray: { id: string, components: any }[] = [
        ...baseItems,
        ...collectibles,
        ...consumables,
        ...inventories,
        ...misc,
        ...mods,
        ...questItems,
        ...reagants
    ];

    const allContent: any = {
        affixes,
        archetypes,
        baseItems: combinedBaseItemsArray,
        dialogueTrees,
        effects,
        encounters,
        families,
        jobs,
        locations,
        lootTables,
        mobs: [playerTemplate, ...npcs, ...mobs],
        nodes,
        quests,
        skills,
        tiers,
        traits,
        spawnPools,
        config,
    };

    return new ContentService(allContent as any);
}

onMounted(() => {
    const contentService = buildContentService();
    gameService = new GameService(contentService, new EventBus());
    gameService.startGame();

    // select first mob proto if available
    const mobList = contentService.mobs ? Array.from(contentService.mobs.keys()) : [];
    if (mobList.length > 0) protoId.value = mobList[0];
});

async function generatePreview() {
    if (!gameService || !protoId.value) return;
    isLoading.value = true;
    try {
        const dto = (gameService as any).generateMobPreview ? gameService.generateMobPreview(protoId.value, level.value) : null;
        preview.value = dto;
    } catch (err) {
        preview.value = { error: String(err) };
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="bg-surface-800 p-4 rounded-lg mt-6">
        <h4 class="text-lg font-semibold text-surface-100 mb-2">Mob Inspector (Live Preview)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
                <label class="block text-sm text-surface-300">Proto ID</label>
                <input v-model="protoId"
                    class="mt-1 block w-full pl-2 pr-2 py-1 bg-surface-700 rounded text-white text-sm" />
            </div>
            <div>
                <label class="block text-sm text-surface-300">Level</label>
                <input type="number" v-model.number="level" min="1" max="99"
                    class="mt-1 block w-full pl-2 pr-2 py-1 bg-surface-700 rounded text-white text-sm" />
            </div>
            <div class="flex items-end">
                <button @click="generatePreview" :disabled="isLoading"
                    class="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded">{{ isLoading ?
                    'Generating...' : 'Generate' }}</button>
            </div>
        </div>

        <div class="bg-surface-700 p-3 rounded text-xs font-mono text-surface-200 max-h-72 overflow-auto">
            <pre v-if="preview">{{ JSON.stringify(preview, null, 2) }}</pre>
            <p v-else class="text-surface-400">No preview yet. Select a proto id and level, then click Generate.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Button from '@/volt/Button.vue';
import { GameService } from 'mmolike_rpg-application/GameService';
import { ContentService } from 'mmolike_rpg-domain/ContentService';
import { AISystem } from 'mmolike_rpg-domain/ecs/systems/combat/AISystem';
import { CombatSystem } from 'mmolike_rpg-domain/ecs/systems/combat/CombatSystem';
import { StatCalculationSystem } from 'mmolike_rpg-domain/ecs/systems/StatCalculationSystem';
import { EquipmentSystem } from 'mmolike_rpg-domain/ecs/systems/EquipmentSystem';
import { Item } from 'mmolike_rpg-domain/ecs/entities/item';


// --- Correct Component Imports ---
import { CombatComponent, CombatantComponent } from 'mmolike_rpg-domain/ecs/components/combat';
import { HealthComponent, ControllableComponent, ProgressionComponent, CoreStatsComponent, ManaComponent, DerivedStatsComponent, InfoComponent, EquipmentComponent } from 'mmolike_rpg-domain/ecs/components/character';
import type { ItemData } from 'mmolike_rpg-domain/ecs/entities/item';
import { Entity } from 'ecs-lib';

// --- Import all game content directly ---
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
// playerProgression is now part of config, so the separate import is removed.


// --- Component State ---
const selectedEncounterId = ref('');
const numberOfSimulations = ref(100);
const playerLevel = ref(1);
const isRunning = ref(false);
const results = ref<any>(null);
const encounterOptions = ref<{ id: string, name: string }[]>([]);

// --- Simulation Logic ---

// This function runs a single, headless combat simulation.
async function runSingleCombat(contentService: ContentService) {
    const gameService = new GameService(contentService);
    gameService.startGame(); // This initializes a fresh world, player, systems, etc.

    // --- Adjust Player to Match Selected Level ---
    const player = gameService.player!;
    const progression = ProgressionComponent.oneFrom(player)!.data;
    const statCalcSystem = gameService.systems.find(s => s instanceof StatCalculationSystem);

    const levelDifference = playerLevel.value - progression.level;
    if (levelDifference > 0) {
        const statsToGain = levelDifference * contentService.config.player_progression.core_stats_per_level;
        const pointsPerStat = Math.floor(statsToGain / 3);

        const oldCoreStats = CoreStatsComponent.oneFrom(player)!.data;
        const newCoreStats = {
            strength: oldCoreStats.strength + pointsPerStat + (statsToGain % 3),
            dexterity: oldCoreStats.dexterity + pointsPerStat,
            intelligence: oldCoreStats.intelligence + pointsPerStat,
        };
        const existingCoreStatsComp = CoreStatsComponent.oneFrom(player)!;
        if (existingCoreStatsComp) player.remove(existingCoreStatsComp);
        player.add(new CoreStatsComponent(newCoreStats));

        const newProgressionData = { ...progression, level: playerLevel.value };
        const existingProgressionComp = ProgressionComponent.oneFrom(player)!;
        if (existingProgressionComp) player.remove(existingProgressionComp);
        player.add(new ProgressionComponent(newProgressionData));

        (statCalcSystem as StatCalculationSystem).update(player);

        const healthData = HealthComponent.oneFrom(player)!.data;
        const existingHealthComp = HealthComponent.oneFrom(player)!;
        if (existingHealthComp) player.remove(existingHealthComp);
        player.add(new HealthComponent({ ...healthData, current: healthData.max }));

        const manaData = ManaComponent.oneFrom(player)!.data;
        const existingManaComp = ManaComponent.oneFrom(player)!;
        if (existingManaComp) player.remove(existingManaComp);
        player.add(new ManaComponent({ ...manaData, current: manaData.max }));
    }

    const combatSystem = gameService.systems.find(s => s instanceof CombatSystem);

    const damageDealtBy: { [id: string]: { name: string, total: number } } = {};
    let overkillDamage = 0;
    const combatLog: string[] = [];
    const subscriptions: (() => void)[] = [];

    const onDamageDealt = gameService.eventBus.on('damageDealt', ({ attackerId, targetId, damage }) => {
        const attacker = gameService.world.getEntity(parseInt(attackerId, 10));
        const target = gameService.world.getEntity(parseInt(targetId, 10));
        if (!attacker || !target) return;

        const attackerName = InfoComponent.oneFrom(attacker)!.data.name;
        const targetName = InfoComponent.oneFrom(target)!.data.name;

        if (!damageDealtBy[attackerId]) {
            damageDealtBy[attackerId] = { name: attackerName, total: 0 };
        }
        damageDealtBy[attackerId].total += damage;

        const targetHealth = HealthComponent.oneFrom(target)!.data;
        if (targetHealth.current < 0) { // Health is already reduced in CombatSystem
            overkillDamage += Math.abs(targetHealth.current);
        }

        combatLog.push(`${attackerName} hits ${targetName} for ${damage} damage.`);
    });
    subscriptions.push(onDamageDealt);

    const onRoundStarted = gameService.eventBus.on('roundStarted', ({ roundNumber }) => {
        combatLog.push(`--- Round ${roundNumber} ---`);
    });
    subscriptions.push(onRoundStarted);

    const playerAI = (combatEntityId: string, actorId: string) => {
        const combatEntity = gameService.world.getEntity(parseInt(combatEntityId, 10));
        if (!combatEntity) return;

        const combatants = CombatComponent.oneFrom(combatEntity)!.data.combatants;
        const enemyIds = combatants.filter(id => CombatantComponent.oneFrom(gameService.world.getEntity(parseInt(id, 10))!)?.data.teamId === 'team2');

        const firstEnemy = enemyIds
            .map(id => gameService.world.getEntity(parseInt(id, 10))!)
            .find(e => HealthComponent.oneFrom(e)!.data.current > 0);

        if (firstEnemy) {
            gameService.eventBus.emit('actionTaken', {
                combatEntityId,
                actorId,
                actionType: 'SKILL',
                skillId: 'basic_attack',
                targetId: String(firstEnemy.id),
            });
        }
    };

    return new Promise(resolve => {
        const onCombatEnded = gameService.eventBus.on('combatEnded', (payload) => {
            const combatEntity = gameService.world.getEntity(parseInt(payload.combatEntityId, 10));
            const roundNumber = CombatComponent.oneFrom(combatEntity!)?.data.roundNumber || 0;
            const playerHealth = HealthComponent.oneFrom(player)!.data;

            // Unsubscribe all listeners
            subscriptions.forEach(unsub => unsub());
            // Unsubscribe the combatEnded listener itself
            onCombatEnded();

            resolve({
                winner: payload.winningTeamId,
                rounds: roundNumber,
                playerHealthRemaining: playerHealth.current,
                playerHealthMax: playerHealth.max,
                damageDealtBy,
                overkillDamage,
                combatLog,
            });
        });

        const onTurnStarted = gameService.eventBus.on('turnStarted', ({ combatEntityId, activeCombatantId }) => {
            const combatant = gameService.world.getEntity(parseInt(activeCombatantId, 10));
            const combatantName = InfoComponent.oneFrom(combatant!)!.data.name;
            const combatEntity = (gameService.world as any).entities.find((e: Entity) => CombatComponent.oneFrom(e));
            const combat = CombatComponent.oneFrom(combatEntity!)!.data;
            combatLog.push(`Round ${combat.roundNumber} | ${combatantName}'s turn.`);
            if (ControllableComponent.oneFrom(combatant!)?.data.isPlayer) {
                playerAI(combatEntityId, activeCombatantId);
            }
        });
        subscriptions.push(onTurnStarted);

        gameService.eventBus.emit('startEncounterRequest', {
            team1: [{ entityId: String(player.id), initialRow: 'Front' }],
            encounterId: selectedEncounterId.value,
        });
    });
}


async function runSimulation() {
    if (!selectedEncounterId.value) {
        alert('Please select an encounter.');
        return;
    }
    isRunning.value = true;
    results.value = null;

    let playerWins = 0;
    let totalRounds = 0;
    let totalHealthRemaining = 0;
    const aggregateDamageDealtBy: { [name: string]: number } = {};
    const timeToDefeat: { [name: string]: { totalRounds: number, count: number } } = {};
    const killingBlowsBy: { [name: string]: number } = {};
    let firstStrikeWins = 0;
    let firstStrikeTotal = 0;
    let totalOverkill = 0;
    let lastCombatLog: string[] = [];
    const numSims = numberOfSimulations.value;

    const combinedBaseItemsArray: { id: string, components: ItemData }[] = [
        ...baseItems,
        ...collectibles,
        ...consumables,
        ...inventories,
        ...misc,
        ...mods,
        ...questItems,
        ...reagants
    ];

    for (let i = 0; i < numSims; i++) {
        const dynamicPlayerTemplate = JSON.parse(JSON.stringify(playerTemplate));

        const levelDifference = playerLevel.value - dynamicPlayerTemplate.components.progression.level;
        if (levelDifference > 0) {
            const statsToGain = levelDifference * config.player_progression.core_stats_per_level;
            const pointsPerStat = Math.floor(statsToGain / 3);

            dynamicPlayerTemplate.components.coreStats.strength += pointsPerStat + (statsToGain % 3);
            dynamicPlayerTemplate.components.coreStats.dexterity += pointsPerStat;
            dynamicPlayerTemplate.components.coreStats.intelligence += pointsPerStat;
            dynamicPlayerTemplate.components.progression.level = playerLevel.value;
        }

        const allContent = {
            affixes, archetypes, baseItems: combinedBaseItemsArray, dialogueTrees, effects,
            encounters, families, jobs, locations, lootTables, mobs: [dynamicPlayerTemplate, ...npcs, ...mobs],
            nodes, quests, skills, tiers, traits, spawnPools, config,
        };

        const contentService = new ContentService(allContent as any);
        const result: any = await runSingleCombat(contentService);

        if (result.winner === 'team1') {
            playerWins++;
            totalHealthRemaining += result.playerHealthRemaining / result.playerHealthMax;
            if (result.playerHadFirstStrike) {
                firstStrikeWins++;
            }
        } else {
            if (result.killingBlowBy) {
                killingBlowsBy[result.killingBlowBy.name] = (killingBlowsBy[result.killingBlowBy.name] || 0) + 1;
            }
        }

        if (result.playerHadFirstStrike) {
            firstStrikeTotal++;
        }

        totalRounds += result.rounds;
        totalOverkill += result.overkillDamage;

        for (const id in result.damageDealtBy) {
            const { name, total } = result.damageDealtBy[id];
            aggregateDamageDealtBy[name] = (aggregateDamageDealtBy[name] || 0) + total;
        }

        // This logic is tricky because entities are destroyed. A better approach would be to get names from the initial combat state.
        // For now, we'll placeholder this.
        for (const id in result.enemyDefeatRounds) {
            const enemyName = "Enemy";
            if (!timeToDefeat[enemyName]) {
                timeToDefeat[enemyName] = { totalRounds: 0, count: 0 };
            }
            timeToDefeat[enemyName].totalRounds += result.enemyDefeatRounds[id];
            timeToDefeat[enemyName].count++;
        }

        if (i === numSims - 1) {
            lastCombatLog = result.combatLog;
        }
    }

    const totalDamageInSims = Object.values(aggregateDamageDealtBy).reduce((sum, val) => sum + val, 0);

    results.value = {
        winRate: ((playerWins / numSims) * 100).toFixed(2),
        avgTTK: (totalRounds / numSims).toFixed(2),
        avgHealthRemainingPercent: playerWins > 0 ? ((totalHealthRemaining / playerWins) * 100).toFixed(2) : '0.00',
        avgOverkill: (totalOverkill / numSims).toFixed(2),
        damageBreakdown: Object.entries(aggregateDamageDealtBy).map(([name, total]) => ({
            name,
            total,
            percentage: totalDamageInSims > 0 ? ((total / totalDamageInSims) * 100).toFixed(2) : '0.00',
        })).sort((a, b) => b.total - a.total),
        sampleCombatLog: lastCombatLog,
        totalFights: numSims,
        playerDeathRate: (((numSims - playerWins) / numSims) * 100).toFixed(2),
        killingBlows: Object.entries(killingBlowsBy).map(([name, count]) => ({ name, count, percentage: (numSims - playerWins > 0 ? ((count / (numSims - playerWins))) * 100 : 0).toFixed(2) })).sort((a, b) => b.count - a.count),
        firstStrikeAdvantage: firstStrikeTotal > 0 ? ((firstStrikeWins / firstStrikeTotal) * 100).toFixed(2) : '0.00'
    };

    isRunning.value = false;
}

onMounted(() => {
    encounterOptions.value = encounters.map((enc: any) => ({ id: enc.id, name: enc.name }));
    if (encounterOptions.value.length > 0) {
        selectedEncounterId.value = encounterOptions.value[0].id;
    }
});
</script>

<template>
    <div class="p-4 md:p-8 h-full overflow-y-auto">
        <h2 class="text-2xl font-bold text-surface-0 mb-4">Combat Simulator</h2>

        <div class="bg-surface-800 rounded-lg shadow-lg p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Configuration -->
                <div class="col-span-1 space-y-4">
                    <div>
                        <label for="player-level" class="block text-sm font-medium text-surface-300">Player
                            Level</label>
                        <input type="number" id="player-level" v-model.number="playerLevel"
                            class="mt-1 block w-full pl-3 pr-4 py-2 text-base border-surface-600 bg-surface-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md text-white" />
                    </div>
                    <div>
                        <label for="encounter" class="block text-sm font-medium text-surface-300">Encounter</label>
                        <select id="encounter" v-model="selectedEncounterId"
                            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-surface-600 bg-surface-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md text-white">
                            <option v-for="opt in encounterOptions" :key="opt.id" :value="opt.id">
                                {{ opt.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label for="sim-count" class="block text-sm font-medium text-surface-300">Number of
                            Fights</label>
                        <input type="number" id="sim-count" v-model.number="numberOfSimulations"
                            class="mt-1 block w-full pl-3 pr-4 py-2 text-base border-surface-600 bg-surface-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md text-white" />
                    </div>
                    <Button @click="runSimulation" :disabled="isRunning" class="w-full">
                        <span v-if="isRunning">Running...</span>
                        <span v-else>Run Simulation</span>
                    </Button>
                </div>

                <!-- Results -->
                <div class="col-span-2 bg-surface-900 p-6 rounded-lg">
                    <h3 class="text-xl font-semibold text-primary-400 mb-4">Results</h3>
                    <div v-if="isRunning" class="text-center">
                        <p class="text-surface-400">Simulating {{ numberOfSimulations }} fights...</p>
                    </div>
                    <div v-else-if="results" class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div class="bg-surface-800 p-4 rounded-lg text-center">
                                <p class="text-sm text-surface-400">Player Win Rate</p>
                                <p class="text-3xl font-bold text-green-400">{{ results.winRate }}%</p>
                            </div>
                            <div class="bg-surface-800 p-4 rounded-lg text-center">
                                <p class="text-sm text-surface-400">Avg. Rounds</p>
                                <p class="text-3xl font-bold text-sky-400">{{ results.avgTTK }}</p>
                            </div>
                            <div class="bg-surface-800 p-4 rounded-lg text-center">
                                <p class="text-sm text-surface-400">Avg. Player Health (Wins)</p>
                                <p class="text-3xl font-bold text-green-500">{{ results.avgHealthRemainingPercent }}%
                                </p>
                            </div>
                        </div>

                        <!-- NEW: Combat Outcome Metrics -->
                        <div>
                            <h4 class="text-lg font-semibold text-surface-100 mb-2 flex items-center gap-2">
                                <i class="pi pi-chart-bar"></i> Combat Outcome Metrics
                            </h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-surface-800 p-4 rounded-lg">
                                    <h5 class="font-bold mb-2 text-surface-300">Player Death Analysis</h5>
                                    <p class="text-3xl font-bold text-red-500 mb-2">{{ results.playerDeathRate }}% <span
                                            class="text-sm font-normal text-surface-400">Death Rate</span></p>
                                    <ul v-if="results.killingBlows.length > 0">
                                        <li v-for="killer in results.killingBlows" :key="killer.name"
                                            class="text-xs flex justify-between">
                                            <span>Killing Blow by {{ killer.name }}:</span>
                                            <span class="font-mono">{{ killer.percentage }}%</span>
                                        </li>
                                    </ul>
                                    <p v-else class="text-xs text-surface-500 italic">No player deaths recorded.</p>
                                </div>
                                <div class="bg-surface-800 p-4 rounded-lg">
                                    <h5 class="font-bold mb-2 text-surface-300">First Strike Advantage</h5>
                                    <p class="text-3xl font-bold text-cyan-400 mb-2">{{ results.firstStrikeAdvantage }}%
                                    </p>
                                    <p class="text-xs text-surface-400">Win rate when player acts first in combat.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 class="text-lg font-semibold text-surface-100 mb-2">Detailed Analysis</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-surface-800 p-4 rounded-lg">
                                    <h5 class="font-bold mb-2 text-surface-300">Damage Contribution</h5>
                                    <ul>
                                        <li v-for="dealer in results.damageBreakdown" :key="dealer.name"
                                            class="flex justify-between text-sm">
                                            <span class="font-semibold">{{ dealer.name }}</span>
                                            <span class="font-mono text-red-400">{{ dealer.percentage }}%</span>
                                        </li>
                                    </ul>
                                </div>
                                <div class="bg-surface-800 p-4 rounded-lg text-center">
                                    <p class="text-sm text-surface-400">Avg. Overkill Damage / Fight</p>
                                    <p class="text-3xl font-bold text-yellow-400">{{ results.avgOverkill }}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 class="text-lg font-semibold text-surface-100 mb-2">Sample Combat Log</h4>
                            <div
                                class="bg-surface-800 p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-xs text-surface-400">
                                <p v-for="(line, i) in results.sampleCombatLog" :key="i"
                                    :class="{ 'text-primary-400 font-bold': line.startsWith('---') }">{{ line }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center">
                        <p class="text-surface-500">Run a simulation to see the results.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { MobGenSystem } from './MobGenSystem';

// A simple utility function for rolling random numbers in a range.
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- DATA STRUCTURES (for content files, e.g., encounters.yaml) ---

/** Defines a single mob's placement within a pre-designed encounter. */
interface EncounterComposition {
    protoId: string; // The mob's master ID (e.g., "WLF-901")
    initialRow: 'Front' | 'Back';
    level?: number; // Optional level override for this specific mob
}

interface EncounterGenerationRule {
    pool: string; // ID of a spawn pool
    count: [number, number]; // Min and max number of mobs to spawn
    level: [number, number] | number; // Level range or fixed level
}

/** Defines a complete, pre-designed group of mobs. */
interface EncounterData {
    id: string;
    name: string;
    level?: number; // Default level for the whole encounter
    composition?: EncounterComposition[];
    generation?: EncounterGenerationRule[];
}

interface SpawnPoolData {
    id: string;
    mobs: string[]; // Array of mob protoIds
}


/**
 * Listens for requests to start encounters, uses the MobGenSystem to create
 * the required mob entities, and then hands them off to the
 * CombatInitiationSystem to begin the battle.
 */
export class EncounterSystem {
    private world: ECS;
    private eventBus: EventBus;
    private mobGenSystem: MobGenSystem; // Direct reference to the factory system
    private content: {
        encounters: Map<string, EncounterData>;
        spawnPools: Map<string, SpawnPoolData>;
    };

    constructor(world: ECS, eventBus: EventBus, loadedContent: any, mobGenSystem: MobGenSystem) {
        this.world = world;
        this.eventBus = eventBus;
        this.content = loadedContent;
        this.mobGenSystem = mobGenSystem;

        this.eventBus.on('startEncounterRequest', this.onStartEncounterRequest.bind(this));
    }

    private onStartEncounterRequest(payload: {
        team1: { entityId: string; initialRow: 'Front' | 'Back'; }[];
        encounterId: string;
    }): void {
        const encounterData = this.content.encounters.get(payload.encounterId);
        if (!encounterData) {
            console.error(`EncounterSystem: Could not find encounter with ID: ${payload.encounterId}`);
            return;
        }

        const generatedMobs: { entityId: string; initialRow: 'Front' | 'Back'; }[] = [];

        // --- Case 1: Static Composition ---
        if (encounterData.composition) {
            for (const mobToSpawn of encounterData.composition) {
                const level = mobToSpawn.level ?? encounterData.level ?? 1; // Use override, then default, then fallback
                const mobEntity = this.mobGenSystem.generateMob(mobToSpawn.protoId, level);
                if (mobEntity) {
                    this.world.addEntity(mobEntity);
                    generatedMobs.push({
                        entityId: mobEntity.id.toString(),
                        initialRow: mobToSpawn.initialRow,
                    });
                }
            }
        }
        // --- Case 2: Dynamic Generation ---
        else if (encounterData.generation) {
            for (const rule of encounterData.generation) {
                const pool = this.content.spawnPools.get(rule.pool);
                if (!pool) {
                    console.error(`EncounterSystem: Spawn pool '${rule.pool}' not found.`);
                    continue;
                }

                const count = randomNumber(rule.count[0], rule.count[1]);
                for (let i = 0; i < count; i++) {
                    const level = Array.isArray(rule.level) ? randomNumber(rule.level[0], rule.level[1]) : rule.level;
                    const randomProtoId = pool.mobs[Math.floor(Math.random() * pool.mobs.length)];
                    const mobEntity = this.mobGenSystem.generateMob(randomProtoId, level);
                    if (mobEntity) {
                        this.world.addEntity(mobEntity);
                        generatedMobs.push({
                            entityId: mobEntity.id.toString(),
                            initialRow: Math.random() < 0.5 ? 'Front' : 'Back', // Randomly assign row
                        });
                    }
                }
            }
        }


        // --- Handoff to Combat ---
        if (generatedMobs.length > 0) {
            this.eventBus.emit('startCombatEncounter', {
                team1: payload.team1,
                team2: generatedMobs,
            });
            console.log(`EncounterSystem: Initiating combat for encounter '${encounterData.name}'.`);
        } else {
            console.warn(`EncounterSystem: No mobs were generated for encounter '${encounterData.name}'. Combat will not start.`);
        }
    }
}


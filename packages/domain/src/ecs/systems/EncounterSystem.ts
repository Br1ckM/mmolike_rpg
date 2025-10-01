import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { MobGenSystem } from './MobGenSystem';

// --- DATA STRUCTURES (for content files, e.g., encounters.yaml) ---

/** Defines a single mob's placement within a pre-designed encounter. */
interface EncounterComposition {
    protoId: string; // The mob's master ID (e.g., "WLF-901")
    initialRow: 'Front' | 'Back';
}

/** Defines a complete, pre-designed group of mobs. */
interface EncounterData {
    id: string;
    name: string;
    composition: EncounterComposition[];
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

        // 1. --- MOB GENERATION ---
        // Tell the MobGenSystem to create each mob defined in the encounter's composition.
        for (const mobToSpawn of encounterData.composition) {
            const mobEntity = this.mobGenSystem.generateMob(mobToSpawn.protoId);
            if (mobEntity) {
                // The MobGenSystem doesn't add the entity to the world, so we do it here.
                this.world.addEntity(mobEntity);
                generatedMobs.push({
                    entityId: mobEntity.id.toString(),
                    initialRow: mobToSpawn.initialRow,
                });
            }
        }

        // 2. --- HANDOFF TO COMBAT ---
        // If any mobs were successfully generated, emit the event that the
        // CombatInitiationSystem is waiting for.
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
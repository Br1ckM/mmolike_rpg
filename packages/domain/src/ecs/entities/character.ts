import { Entity } from 'ecs-lib';
import {
    InfoComponent,
    ControllableComponent,
    CoreStatsComponent,
    DerivedStatsComponent,
    JobsComponent,
    EquipmentComponent,
    InventoryComponent,
    ProfessionsComponent,
    HealthComponent,
    ManaComponent,
    SkillBookComponent,
    ConsumableBeltComponent,
    ProgressionComponent,
    type InfoData,
    type ControllableData,
    type CoreStatsData,
    type DerivedStatsData,
    type JobsData,
    type EquipmentData,
    type InventoryData,
    type ProfessionsData,
    type HealthData,
    type ManaData,
    type ResourceData,
    type SkillBookData,
    type ConsumableBeltData,
} from '../components/character';
import type { ProgressionData } from '../components/skill';

/**
 * CharacterData (v2)
 * - Preferred: provide health/mana as resource components.
 * - Back-compat: if health/mana are missing, we fall back to derivedStats.{health,mana} as capacity.
 */
export interface CharacterData {
    info: InfoData;
    controllable: ControllableData;
    coreStats: CoreStatsData;
    derivedStats: DerivedStatsData; // attack, defense, etc. (no health/mana)
    /** New preferred shape */
    health?: HealthData;
    mana?: ManaData;
    /** Optional alternative nesting if your YAML groups resources */
    resources?: {
        health?: HealthData;
        mana?: ManaData;
    };
    jobs: JobsData;
    equipment: EquipmentData;
    inventory?: InventoryData;
    professions?: ProfessionsData;
    skillBook?: SkillBookData;
    consumableBelt?: ConsumableBeltData;
    progression?: ProgressionData;
}

function clampResource(r: ResourceData): ResourceData {
    const max = Math.max(0, r.max | 0);
    const current = Math.max(0, Math.min(max, r.current | 0));
    return { current, max };
}

/**
 * Build a ResourceData from:
 * 1) explicit component data (preferred), else
 * 2) legacy derived capacity (treated as max; current = max by default).
 * Flip spawnEmpty to true if you want current = 0 instead.
 */
function normalizeResource(
    explicit?: ResourceData,
    legacyCapacity?: number,
    spawnEmpty = false,
): ResourceData {
    if (explicit && Number.isFinite(explicit.current) && Number.isFinite(explicit.max)) {
        return clampResource(explicit);
    }
    const max = Math.max(0, Math.floor(legacyCapacity ?? 0));
    return spawnEmpty ? { current: 0, max } : { current: max, max };
}

/**
 * Represents a character in the game world.
 */
export class Character extends Entity {
    constructor(data: CharacterData) {
        super();

        // Base components
        this.add(new InfoComponent(data.info));
        this.add(new ControllableComponent(data.controllable));
        this.add(new CoreStatsComponent(data.coreStats));
        this.add(new DerivedStatsComponent(data.derivedStats)); // no health/mana inside

        // Resource components (prefer explicit; fall back to legacy derived capacity)
        const healthData = normalizeResource(
            data.health ?? data.resources?.health,
            (data as any)?.derivedStats?.health,
      /* spawnEmpty */ false,
        );
        const manaData = normalizeResource(
            data.mana ?? data.resources?.mana,
            (data as any)?.derivedStats?.mana,
      /* spawnEmpty */ false,
        );

        this.add(new HealthComponent(healthData));
        this.add(new ManaComponent(manaData));

        // Progression/equipment
        this.add(new JobsComponent(data.jobs));
        this.add(new EquipmentComponent(data.equipment));

        // Optional, player-only-ish
        if (data.inventory) this.add(new InventoryComponent(data.inventory));
        if (data.professions) this.add(new ProfessionsComponent(data.professions));
        if (data.skillBook) this.add(new SkillBookComponent(data.skillBook));
        if (data.consumableBelt) this.add(new ConsumableBeltComponent(data.consumableBelt));
        if (data.progression) this.add(new ProgressionComponent(data.progression));
    }

    // Helper methods
    get name(): string {
        return InfoComponent.oneFrom(this).data.name;
    }

    isPlayer(): boolean {
        return ControllableComponent.oneFrom(this).data.isPlayer;
    }
}

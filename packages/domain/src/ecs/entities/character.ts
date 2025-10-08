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
    AppearanceComponent,
    VoreRoleComponent,
    VoreComponent,
    type AppearanceComponentData, // <-- FIX: Corrected import name
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
    type ConsumableBeltData
} from '../components/character';
import { type ProgressionData, ProgressionComponent } from '../components/skill';

/**
 * CharacterData (v2)
 */
export interface CharacterData {
    info: InfoData;
    controllable: ControllableData;
    coreStats: CoreStatsData;
    derivedStats: DerivedStatsData;
    health?: HealthData;
    mana?: ManaData;
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
    appearance?: AppearanceComponentData; // <-- FIX: Use correct type and make it optional
}

function clampResource(r: ResourceData): ResourceData {
    const max = Math.max(0, r.max | 0);
    const current = Math.max(0, Math.min(max, r.current | 0));
    return { current, max };
}

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
        this.add(new DerivedStatsComponent(data.derivedStats));

        // Resource components
        const healthData = normalizeResource(
            data.health ?? data.resources?.health,
            (data as any)?.derivedStats?.health,
            false,
        );
        const manaData = normalizeResource(
            data.mana ?? data.resources?.mana,
            (data as any)?.derivedStats?.mana,
            false,
        );

        this.add(new HealthComponent(healthData));
        this.add(new ManaComponent(manaData));

        // Progression/equipment
        this.add(new JobsComponent(data.jobs));
        this.add(new EquipmentComponent(data.equipment));

        // Optional components
        if (data.inventory) this.add(new InventoryComponent(data.inventory));
        if (data.professions) this.add(new ProfessionsComponent(data.professions));
        if (data.skillBook) this.add(new SkillBookComponent(data.skillBook));
        if (data.consumableBelt) this.add(new ConsumableBeltComponent(data.consumableBelt));
        if (data.progression) this.add(new ProgressionComponent(data.progression));
        if (data.appearance) this.add(new AppearanceComponent(data.appearance)); // <-- Add the component if data exists
        if ((data as any).vorerole) this.add(new VoreRoleComponent((data as any).vorerole));
        if ((data as any).vore) this.add(new VoreComponent((data as any).vore));
    }

    // Helper methods
    get name(): string {
        return InfoComponent.oneFrom(this).data.name;
    }

    isPlayer(): boolean {
        return ControllableComponent.oneFrom(this).data.isPlayer;
    }
}


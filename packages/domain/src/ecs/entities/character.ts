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
    InfoData,
    ControllableData,
    CoreStatsData,
    DerivedStatsData,
    JobsData,
    EquipmentData,
    InventoryData,
    ProfessionsData,
    HealthData,
    SkillBookComponent, SkillBookData
} from '../components/character';
import {

} from '../components/character';

/**
 * A complete data structure representing the raw data for a character,
 * typically parsed from a YAML file. This interface serves as a contract
 * for creating a new Character entity.
 */

// The data structure for our YAML files remains the same.
export interface CharacterData {
    info: InfoData;
    controllable: ControllableData;
    coreStats: CoreStatsData;
    derivedStats: DerivedStatsData;
    health: HealthData;
    jobs: JobsData;
    equipment: EquipmentData;
    inventory?: InventoryData;
    professions?: ProfessionsData;
    skillBook?: SkillBookData;
}

/**
 * Represents a character in the game world.
 * Its constructor is responsible for adding all necessary components.
 */
export class Character extends Entity {
    constructor(data: CharacterData) {
        super();

        // Now we instantiate the component classes with the data.
        this.add(new InfoComponent(data.info));
        this.add(new ControllableComponent(data.controllable));
        this.add(new CoreStatsComponent(data.coreStats));
        this.add(new DerivedStatsComponent(data.derivedStats));
        this.add(new HealthComponent(data.health));
        this.add(new JobsComponent(data.jobs));
        this.add(new EquipmentComponent(data.equipment));

        // Player-only components are added conditionally.
        if (data.inventory) {
            this.add(new InventoryComponent(data.inventory));
        }
        if (data.professions) {
            this.add(new ProfessionsComponent(data.professions));
        }
        if (data.skillBook) {
            this.add(new SkillBookComponent(data.skillBook));
        }
    }

    // Helper methods now use the component class as a key.
    get name(): string {
        return InfoComponent.oneFrom(this).data.name;
    }

    isPlayer(): boolean {
        return ControllableComponent.oneFrom(this).data.isPlayer;
    }
}
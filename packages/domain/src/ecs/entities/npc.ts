import { Entity } from 'ecs-lib';
import { InfoComponent, type InfoData } from '../components/character';
import { QuestGiverComponent, type QuestGiverData } from '../components/quest';
import {
    DialogueComponent, type DialogueComponentData,
    VendorComponent, type VendorComponentData,
    TrainerComponent, type TrainerComponentData,
    ServiceProviderComponent, type ServiceProviderComponentData,
    ScheduleComponent, type ScheduleComponentData,
    CompanionComponent, type CompanionComponentData
} from '../components/npc';

/**
 * A complete data structure representing the raw data for an NPC,
 * typically parsed from a YAML file. This interface serves as the contract
 * for creating a new NPC entity.
 */
export interface NPCEntityData {
    info: InfoData;
    dialogue?: DialogueComponentData;
    questGiver?: QuestGiverData;
    vendor?: VendorComponentData;
    trainer?: TrainerComponentData;
    serviceProvider?: ServiceProviderComponentData;
    schedule?: ScheduleComponentData;
    companion?: CompanionComponentData;
}

/**
 * Represents a non-player character in the game world.
 * Its constructor is responsible for adding all necessary components based on the
 * provided data, making it a flexible factory for any type of NPC.
 */
export class NPC extends Entity {
    constructor(data: NPCEntityData) {
        super();

        // Every NPC must have basic information.
        this.add(new InfoComponent(data.info));

        // Conditionally add components based on the NPC's defined roles.
        if (data.dialogue) {
            this.add(new DialogueComponent(data.dialogue));
        }
        if (data.questGiver) {
            this.add(new QuestGiverComponent(data.questGiver));
        }
        if (data.vendor) {
            this.add(new VendorComponent(data.vendor));
        }
        if (data.trainer) {
            this.add(new TrainerComponent(data.trainer));
        }
        if (data.serviceProvider) {
            this.add(new ServiceProviderComponent(data.serviceProvider));
        }
        if (data.schedule) {
            this.add(new ScheduleComponent(data.schedule));
        }
        if (data.companion) {
            this.add(new CompanionComponent(data.companion));
        }
    }
}
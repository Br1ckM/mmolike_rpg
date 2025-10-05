// packages/domain/src/ecs/entities/skill.ts

import { Entity } from 'ecs-lib';
import {
    SkillInfoComponent, type SkillInfoData,
    SkillComponent, type SkillData,
    ProgressionComponent, type ProgressionData,
    EvolutionComponent, type EvolutionLevelData
} from '../components/skill';

// Blueprint for raw skill data from YAML
export interface SkillEntityData {
    info: SkillInfoData;
    skill: SkillData;
    progression?: ProgressionData;
    evolution?: EvolutionLevelData[]; // The YAML "evolution" key holds an array
}

export class Skill extends Entity {
    constructor(data: SkillEntityData) {
        super();
        this.add(new SkillInfoComponent(data.info));
        this.add(new SkillComponent(data.skill));
        if (data.progression) this.add(new ProgressionComponent(data.progression));
        if (data.evolution) this.add(new EvolutionComponent({ evolutions: data.evolution })); // Wrap array in the component data object
    }
}
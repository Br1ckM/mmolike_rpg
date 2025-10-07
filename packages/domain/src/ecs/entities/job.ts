import { Entity } from 'ecs-lib';
import {
    SkillInfoComponent as JobInfoComponent, // Re-using for name/description
    type SkillInfoData as JobInfoData,
    ProgressionComponent, type ProgressionData,
    SkillListComponent, type SkillListData
} from '../components/skill';

// Blueprint for raw job data from YAML
export interface JobEntityData {
    info: JobInfoData;
    progression: ProgressionData;
    skills: SkillListData;
}

export class Job extends Entity {
    constructor(data: JobEntityData) {
        super();
        this.add(new JobInfoComponent(data.info));
        this.add(new ProgressionComponent(data.progression));
        this.add(new SkillListComponent(data.skills)); // Wrap array in the component data object
    }
}
import { Entity } from 'ecs-lib';
import {
    QuestComponent, QuestData,
    QuestObjectiveComponent, QuestObjectiveData
} from '../components/quest';

export interface QuestEntityData {
    info: QuestData;
    objectives: QuestObjectiveData[];
}

export class Quest extends Entity {
    constructor(data: QuestEntityData) {
        super();
        this.add(new QuestComponent(data.info));
        this.add(new QuestObjectiveComponent(data.objectives));
    }
}
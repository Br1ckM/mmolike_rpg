import { Entity } from 'ecs-lib';
import {
    EffectDefinitionComponent,
    EffectDefinitionData
} from '../components/effects';

export class Effect extends Entity {
    constructor(data: EffectDefinitionData) {
        super();
        this.add(new EffectDefinitionComponent(data));
    }
}
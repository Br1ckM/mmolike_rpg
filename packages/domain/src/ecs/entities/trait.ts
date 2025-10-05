// packages/domain/src/ecs/entities/trait.ts

import { Entity } from 'ecs-lib';
import {
    TraitDefinitionComponent,
    type TraitData
} from '../components/traits';

export class Trait extends Entity {
    constructor(data: TraitData) {
        super();
        this.add(new TraitDefinitionComponent(data));
    }
}
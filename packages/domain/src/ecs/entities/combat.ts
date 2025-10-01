import { Entity } from 'ecs-lib';
import {
    CombatComponent,
    CombatComponentData,
} from '../components/combat';

/**
 * Represents the state of a single combat encounter. This entity is created
 * at the start of a battle and destroyed when it ends.
 */
export class Combat extends Entity {
    constructor(data: CombatComponentData) {
        super();
        this.add(new CombatComponent(data));
    }
}
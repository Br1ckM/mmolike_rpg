import { Entity } from 'ecs-lib';
import { DenRunComponent, type DenRunData } from '../components/den';

/**
 * A temporary entity that represents the state of a single Den run.
 * It is created when a den is entered and destroyed when it is completed or failed.
 */
export class DenRun extends Entity {
    constructor(data: DenRunData) {
        super();
        this.add(new DenRunComponent(data));
    }
}
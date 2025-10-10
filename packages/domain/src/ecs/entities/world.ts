import { Entity } from 'ecs-lib';
import {
    ContainerComponent, type ContainerComponentData,
    InteractionTargetComponent, type InteractionTargetComponentData,
    LocationComponent, type LocationComponentData,
    NodeComponent, type NodeComponentData,
    TravelTargetComponent, type TravelTargetComponentData
} from '../components/world';

const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * The data structure for creating a Location entity from a YAML file.
 */
export interface LocationEntityData {
    location: LocationComponentData;
    container?: ContainerComponentData;
}

/**
 * The data structure for creating a Node entity from a YAML file.
 */
export interface NodeEntityData {
    node: NodeComponentData;
    travelTarget?: TravelTargetComponentData;
    interactionTarget?: InteractionTargetComponentData;
}

export class World extends Entity {
    constructor() {
        super();
    }
}

/**
 * Represents a location in the world, which can be a Zone, Hub, Dungeon, etc.
 * It is defined by its LocationComponent and a ContainerComponent that holds
 * all the entities (like Nodes and NPCs) within it.
 */
export class Location extends Entity {
    constructor(data: LocationEntityData) {
        super();
        this.add(new LocationComponent(data.location));

        // Most locations will contain other entities
        if (data.container) {
            this.add(new ContainerComponent(data.container));
        }
    }
}

/**
 * Represents a point of interest ("node") within a Location. Its function is
 * determined by its components: a TravelTargetComponent makes it a doorway,
 * while an InteractionTargetComponent makes it a resource or encounter.
 */
export class Node extends Entity {
    constructor(data: NodeEntityData) {
        super();

        // --- NEW: Initialize uses for depletable nodes ---
        if (data.node.isDepletable && data.node.uses) {
            data.node.usesRemaining = randomNumber(data.node.uses[0], data.node.uses[1]);
        }
        // --- END NEW ---

        this.add(new NodeComponent(data.node));

        if (data.travelTarget) {
            this.add(new TravelTargetComponent(data.travelTarget));
        }
        if (data.interactionTarget) {
            this.add(new InteractionTargetComponent(data.interactionTarget));
        }
    }
}
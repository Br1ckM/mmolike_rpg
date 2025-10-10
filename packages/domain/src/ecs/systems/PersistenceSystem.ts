import ECS, { Entity, Component } from 'ecs-lib';

// FIX: Define a concrete, empty class to bypass the 'abstract class' restriction
class BaseEntityForDeserialization extends Entity { }

// FIX: Import all component classes from the new barrel file
import * as Components from '../components';

// FIX: Dynamically build the map from the imported object
const componentNameToClassMap = new Map<string, new (data: any) => Component<any>>();
for (const componentName in Components) {
    const componentClass = (Components as any)[componentName];
    // A check to specifically exclude the abstract 'Component' class
    if (componentName !== 'Component' && typeof componentClass === 'function' && componentClass.prototype instanceof Component) {
        componentNameToClassMap.set(componentName, componentClass);
    }
}


interface SerializedEntity {
    id: number;
    components: {
        name: string;
        data: any;
    }[];
}

export interface SaveData {
    entities: SerializedEntity[];
}

/**
 * Handles the serialization and deserialization of the game world state.
 */
export class PersistenceSystem {

    /**
     * Converts the entire ECS world into a JSON-serializable object.
     */
    public serialize(world: ECS): SaveData {
        const serializedEntities: SerializedEntity[] = [];
        const entities = (world as any).entities as Entity[];

        for (const entity of entities) {
            // --- FIX: Safely cast the components property to an array before using map ---
            const components = (entity as any).components as Component<any>[];
            if (!Array.isArray(components)) {
                console.error(`[PersistenceSystem] Entity ${entity.id} has components property that is not an array. Skipping serialization for this entity.`);
                continue; // Skip this entity if components property is invalid
            }
            // --- END FIX ---

            serializedEntities.push({
                id: entity.id,
                components: components.map(c => ({
                    name: c.constructor.name,
                    data: c.data
                }))
            });
        }
        return { entities: serializedEntities };
    }

    /**
     * Clears the current world and restores its state from save data.
     */
    public deserialize(world: ECS, saveData: SaveData): void {
        // Clear existing world state
        (world as any).entities.slice().forEach((e: Entity) => world.removeEntity(e));
        (world as any)._nextEntityId = 1;

        // Re-create entities and components from save data
        for (const savedEntity of saveData.entities) {
            // FIX: Use the concrete subclass instead of the abstract Entity
            const newEntity = new BaseEntityForDeserialization();
            (newEntity as any).id = savedEntity.id; // Preserve original ID

            for (const savedComponent of savedEntity.components) {
                const ComponentClass = componentNameToClassMap.get(savedComponent.name);
                if (ComponentClass) {
                    newEntity.add(new ComponentClass(savedComponent.data));
                } else {
                    console.warn(`Could not find component class for: ${savedComponent.name}`);
                }
            }
            world.addEntity(newEntity);
            // Ensure the next entity ID is higher than any loaded ID
            (world as any)._nextEntityId = Math.max((world as any)._nextEntityId, savedEntity.id + 1);
        }
    }
}

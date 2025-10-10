import ECS, { Entity, Component } from 'ecs-lib';
import * as Components from '../components';

// A concrete class for deserialization, as required.
class BaseEntityForDeserialization extends Entity { }

// Create a map of string names to the actual Component classes for deserialization.
const componentNameToClassMap = new Map<string, any>();
for (const componentName in Components) {
    const componentClass = (Components as any)[componentName];
    if (componentName !== 'Component' && typeof componentClass.register === 'function') {
        componentNameToClassMap.set(componentName, componentClass);
    }
}

// --- CORE FIX ---
// Create an array of all known component classes to iterate over for serialization.
// This preserves the static methods like `oneFrom`.
const AllComponentClasses = Object.entries(Components)
    .filter(([name, C]) => name !== 'Component' && typeof (C as any).register === 'function')
    .map(([name, C]) => ({ name, class: C as any }));
// --- END CORE FIX ---


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
            const serializedComponents: { name: string; data: any; }[] = [];

            // Iterate over our array of known component classes.
            for (const { name, class: ComponentClass } of AllComponentClasses) {
                // Use the library's intended static method on the specific class.
                const component = ComponentClass.oneFrom(entity);
                if (component) {
                    serializedComponents.push({
                        name: name,
                        data: component.data
                    });
                }
            }

            if (serializedComponents.length > 0) {
                serializedEntities.push({
                    id: entity.id,
                    components: serializedComponents
                });
            }
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
            (world as any)._nextEntityId = Math.max((world as any)._nextEntityId, savedEntity.id + 1);
        }
    }
}
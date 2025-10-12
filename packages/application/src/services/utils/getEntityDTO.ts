/**
 * getEntityDTO
 *
 * A small, dependency-light helper that builds a DTO from an ECS entity by
 * asking a list of component accessors for their data. Component accessors
 * are objects with a `oneFrom(entity)` method (as used in the domain ECS).
 *
 * This avoids importing domain component types at module load time and keeps
 * the application package safe to compile even when domain packages are not
 * available. Callers can pass the list of components they care about.
 */
export type ComponentAccessor = {
    // any object that exposes `oneFrom(entity): { data: any } | null`
    oneFrom: (entity: any) => any;
};

export function getEntityDTO(entity: any, components?: { accessor: ComponentAccessor; key: string }[]) {
    if (!entity) return null;

    const dto: { [k: string]: any } = { id: (entity as any).id };

    if (!components || components.length === 0) return dto;

    for (const comp of components) {
        try {
            const c = comp.accessor;
            if (c && typeof c.oneFrom === 'function') {
                const instance = c.oneFrom(entity);
                if (instance) dto[comp.key] = instance.data ?? instance;
            }
        } catch (err) {
            // swallow errors to remain safe when components are incompatible
        }
    }

    return dto;
}

export default getEntityDTO;

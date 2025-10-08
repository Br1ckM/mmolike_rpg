import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { CompanionComponent, ScheduleComponent } from '../components/npc';
import { ContainerComponent } from '../components/world';
import { InfoComponent } from '../components/character';

// A simple configuration for party rules.
const MAX_ACTIVE_PARTY_MEMBERS = 4; // Player + 3 companions

/**
 * Manages the player's party, including recruitment and roster changes.
 */
export class PartySystem {
    private world: ECS;
    private eventBus: EventBus;
    private contentIdToEntityIdMap: Map<string, number>; // <-- Add map property

    constructor(world: ECS, eventBus: EventBus, contentIdToEntityIdMap: Map<string, number>) { // <-- Add map to constructor
        this.world = world;
        this.eventBus = eventBus;
        this.contentIdToEntityIdMap = contentIdToEntityIdMap; // <-- Store the map
        this.eventBus.on('companionRecruited', this.onCompanionRecruited.bind(this));
    }

    /**
     * Handles the event fired when a player successfully recruits a companion.
     */
    private onCompanionRecruited(payload: { characterId: number; npcId: number; }): void {
        const companionEntity = this.world.getEntity(payload.npcId);
        if (!companionEntity) return;

        const companionComponent = CompanionComponent.oneFrom(companionEntity)?.data;
        if (!companionComponent || companionComponent.recruited) return;

        companionComponent.recruited = true;

        const companionInfo = InfoComponent.oneFrom(companionEntity)?.data;
        const companionContentId = companionInfo?.id;
        const schedule = ScheduleComponent.oneFrom(companionEntity)?.data;
        const currentLocationContentId = schedule?.currentLocationId;

        if (companionContentId && currentLocationContentId) {
            // --- FIX: Use the map to look up the location's numeric ID ---
            const locationEntityId = this.contentIdToEntityIdMap.get(currentLocationContentId);
            const locationEntity = locationEntityId ? this.world.getEntity(locationEntityId) : undefined;
            // --- END FIX ---

            if (locationEntity) {
                const container = ContainerComponent.oneFrom(locationEntity)?.data;
                if (container) {
                    const index = container.containedEntityIds.indexOf(companionContentId);
                    if (index > -1) {
                        container.containedEntityIds.splice(index, 1);
                        console.log(`[PartySystem] Removed ${companionContentId} from location ${locationEntity.id}.`);
                    }
                }
            }
        }

        const activeParty = this.getActiveParty(payload.characterId);
        if (activeParty.length < MAX_ACTIVE_PARTY_MEMBERS) {
            companionComponent.inActiveParty = true;
        }

        console.log(`[PartySystem] Companion ${payload.npcId} has been recruited.`);

        this.eventBus.emit('partyUpdated', { characterId: payload.characterId });
        this.eventBus.emit('playerStateModified', { characterId: payload.characterId });
        this.eventBus.emit('playerLocationChanged', { characterId: payload.characterId, newLocationId: '' });
    }

    private getActiveParty(characterId: number): Entity[] {
        // ... (this method remains the same)
        const player = this.world.getEntity(characterId);
        if (!player) return [];

        const allEntities = (this.world as any).entities as Entity[];
        const companions = allEntities.filter(e => {
            const comp = CompanionComponent.oneFrom(e)?.data;
            return comp && comp.recruited && comp.inActiveParty;
        });

        return [player, ...companions];
    }
}
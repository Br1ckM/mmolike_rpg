import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { CompanionComponent, ScheduleComponent } from '../components/npc';
import { ContainerComponent } from '../components/world';
import { InfoComponent } from '../components/character';
import { GameSystem } from './GameSystem'; // Import the new base class

// A simple configuration for party rules.
const MAX_ACTIVE_PARTY_MEMBERS = 4; // Player + 3 companions

/**
 * Manages the player's party, including recruitment and roster changes.
 */
export class PartySystem extends GameSystem { // Extend GameSystem
    private contentIdToEntityIdMap: Map<string, number>;

    constructor(world: ECS, eventBus: EventBus, contentIdToEntityIdMap: Map<string, number>) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.contentIdToEntityIdMap = contentIdToEntityIdMap;

        // Use the inherited 'subscribe' method
        this.subscribe('companionRecruited', this.onCompanionRecruited.bind(this));
        this.subscribe('swapCompanionRequested', this.onSwapCompanion.bind(this));
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
            const locationEntityId = this.contentIdToEntityIdMap.get(currentLocationContentId);
            const locationEntity = locationEntityId ? this.world.getEntity(locationEntityId) : undefined;

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

    private onSwapCompanion(payload: { characterId: number; companionId: number; }): void {
        const companionEntity = this.world.getEntity(payload.companionId);
        if (!companionEntity) return;

        const companion = CompanionComponent.oneFrom(companionEntity)?.data;
        if (!companion || !companion.recruited) return;

        const activeParty = this.getActiveParty(payload.characterId);

        if (companion.inActiveParty) {
            companion.inActiveParty = false;
        } else {
            if (activeParty.length < MAX_ACTIVE_PARTY_MEMBERS) {
                companion.inActiveParty = true;
            } else {
                this.eventBus.emit('notification', { type: 'warn', message: 'Your party is full.' });
                return;
            }
        }

        console.log(`[PartySystem] Swapped companion ${payload.companionId}. Active status: ${companion.inActiveParty}`);
        this.eventBus.emit('partyUpdated', { characterId: payload.characterId });
    }

    private getActiveParty(characterId: number): Entity[] {
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
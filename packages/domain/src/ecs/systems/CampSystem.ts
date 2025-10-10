import { EventBus } from '../EventBus';
import ECS, { Entity } from 'ecs-lib';
import { HealthComponent, ManaComponent, ControllableComponent } from '../components/character';
import { CompanionComponent } from '../components/npc';
import { GameSystem } from './GameSystem';

/**
 * Handles non-combat, camp-related activities like resting.
 */
export class CampSystem extends GameSystem {

    constructor(world: ECS, eventBus: EventBus) {
        super(world, eventBus, []);
        this.subscribe('restRequested', this.handleRest.bind(this));
    }

    /**
     * Restores the health and mana of the entire active party.
     */
    private handleRest(payload: { characterId: number }): void {
        const playerEntity = this.world.getEntity(payload.characterId);
        if (!playerEntity || !ControllableComponent.oneFrom(playerEntity)) {
            console.warn(`[CampSystem] Rest requested for a non-player entity.`);
            return;
        }

        const partyToRest: Entity[] = [playerEntity];

        const allEntities = (this.world as any).entities as Entity[];
        allEntities.forEach(entity => {
            const companion = CompanionComponent.oneFrom(entity)?.data;
            if (companion && companion.recruited && companion.inActiveParty) {
                partyToRest.push(entity);
            }
        });

        // --- REVISED HEALING LOGIC ---
        partyToRest.forEach(character => {
            const health = HealthComponent.oneFrom(character)?.data;
            const mana = ManaComponent.oneFrom(character)?.data;

            if (health && health.current < health.max) {
                const amountToHeal = health.max - health.current;
                health.current = health.max;
                this.eventBus.emit('healthHealed', {
                    healerId: character.id.toString(), // The character is healing themselves by resting
                    targetId: character.id.toString(),
                    amount: amountToHeal
                });
            }

            if (mana) {
                mana.current = mana.max;
            }
        });
        // --- END REVISED LOGIC ---

        console.log('[CampSystem] Active party has rested. Health and mana restored.');

        this.eventBus.emit('notification', {
            type: 'success',
            message: 'Your party feels well-rested.'
        });

        this.eventBus.emit('playerStateModified', { characterId: playerEntity.id });
    }
}
import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import {
    VoreComponent,
    PreyComponent,
    PredatorComponent,
    VoreRoleComponent,
    type VoreRole,
    HealthComponent,
    type VoreContainerType,
    InfoComponent,
    type PreyComponentData
} from '../components/character';
import { CombatantComponent, CombatComponent } from '../components/combat';
import { Character } from '../entities/character';

// Constants for struggle calculation
const STRUGGLE_CHANCE = 0.35; // 35% chance to struggle per turn per prey

// Helper function to get a specific vore container
const getContainer = (voreData: any, containerType: VoreContainerType) => {
    return voreData[containerType];
};

/**
 * Manages the logic for vore-related actions and states.
 */
export class VoreSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        this.eventBus.on('setPlayerVoreRole', this.onSetPlayerVoreRole.bind(this));
        this.eventBus.on('actionTaken', this.onActionTaken.bind(this));
        this.eventBus.on('turnStarted', this.onTurnStarted.bind(this));
        this.eventBus.on('playerLocationChanged', this.onPlayerLocationChanged.bind(this));
        this.eventBus.on('preyDigested', this.onPreyDigested.bind(this));
        this.eventBus.on('regurgitateRequest', this.onRegurgitateRequest.bind(this));
        this.eventBus.on('dev_addPreyToStomach', this.onDevAddPreyToStomach.bind(this));
    }

    private onDevAddPreyToStomach(payload: { playerId: number, preyData: any }): void {
        const player = this.world.getEntity(payload.playerId);
        if (!player) return;

        const voreComponent = VoreComponent.oneFrom(player)?.data;
        if (!voreComponent) {
            this.eventBus.emit('notification', { type: 'error', message: "Player has no vore containers." });
            return;
        }

        const stomach = getContainer(voreComponent, 'Stomach');
        if (!stomach) {
            console.error('[VoreSystem] Could not find a valid stomach container.');
            return;
        }

        const mockPreyData: PreyComponentData = {
            name: payload.preyData.name,
            size: payload.preyData.size,
            digestionTime: payload.preyData.digestionTime,
            nutritionValue: payload.preyData.nutritionValue,
            strugglePower: payload.preyData.strugglePower,
        };

        stomach.contents.push({
            entityId: -1,
            name: mockPreyData.name,
            size: mockPreyData.size,
            digestionTimer: mockPreyData.digestionTime,
            preyData: mockPreyData
        });

        this.eventBus.emit('notification', { type: 'info', message: `DEV: Added ${mockPreyData.name} to stomach.` });
        this.eventBus.emit('playerStateModified', { characterId: player.id });
    }

    private onSetPlayerVoreRole(payload: { characterId: number; newRole: VoreRole }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        let roleComponent = VoreRoleComponent.oneFrom(character);
        if (!roleComponent) {
            roleComponent = new VoreRoleComponent({ role: 'Neither' });
            character.add(roleComponent);
        }
        roleComponent.data.role = payload.newRole;

        const hasPredator = !!PredatorComponent.oneFrom(character);
        const hasPrey = !!PreyComponent.oneFrom(character);
        const hasVore = !!VoreComponent.oneFrom(character);

        if (payload.newRole === 'Predator' || payload.newRole === 'Both') {
            if (!hasPredator) character.add(new PredatorComponent({ availableVoreSkills: ['skill_devour_oral'] }));
            if (!hasVore) {
                character.add(new VoreComponent({
                    Stomach: { capacity: 10, contents: [], digestionRate: 1 },
                    Bowels: { capacity: 5, contents: [], digestionRate: 1 },
                    Womb: { capacity: 1, contents: [], digestionRate: 0 },
                    Breasts: { capacity: 2, contents: [], digestionRate: 0 },
                }));
            }
        } else {
            if (hasPredator) character.remove(PredatorComponent.oneFrom(character)!);
            if (hasVore) character.remove(VoreComponent.oneFrom(character)!);
        }

        if (payload.newRole === 'Prey' || payload.newRole === 'Both') {
            const info = InfoComponent.oneFrom(character)?.data;
            if (!hasPrey) character.add(new PreyComponent({ name: info?.name || 'Player Prey', size: 1, digestionTime: 5, nutritionValue: 50, strugglePower: 10 }));
        } else {
            if (hasPrey) character.remove(PreyComponent.oneFrom(character)!);
        }

        console.log(`[VoreSystem] Character ${payload.characterId} role set to ${payload.newRole}`);
        this.eventBus.emit('playerStateModified', { characterId: payload.characterId });
    }

    private onRegurgitateRequest(payload: { predatorId: number }): void {
        const predator = this.world.getEntity(payload.predatorId);
        if (!predator) return;

        const voreComponent = VoreComponent.oneFrom(predator)?.data;
        if (!voreComponent) return;

        let preyToRelease: { stomach: any, index: number, content: any } | null = null;

        const stomach = getContainer(voreComponent, 'Stomach');
        if (stomach && stomach.contents.length > 0) {
            preyToRelease = {
                stomach: stomach,
                index: stomach.contents.length - 1,
                content: stomach.contents[stomach.contents.length - 1]
            };
        }

        if (preyToRelease) {
            const { content } = preyToRelease;
            preyToRelease.stomach.contents.splice(preyToRelease.index, 1);

            this.respawnPreyEntity(predator, content.preyData);

            this.eventBus.emit('notification', {
                type: 'info',
                message: `You released ${content.name} back into the world.`
            });
            this.eventBus.emit('playerStateModified', { characterId: predator.id });
        } else {
            const predInfo = InfoComponent.oneFrom(predator)?.data;
            this.eventBus.emit('notification', {
                type: 'info',
                message: `${predInfo ? predInfo.name : 'The Predator'} has nothing to release.`
            });
        }
    }

    private respawnPreyEntity(predator: Entity, preyDataSnapshot: PreyComponentData): void {
        const newCharacterData = {
            info: { name: preyDataSnapshot.name, race: 'Prey', avatarUrl: 'pi-eye' },
            controllable: { isPlayer: false },
            coreStats: { strength: 1, dexterity: 1, intelligence: 1 },
            derivedStats: { attack: 1, magicAttack: 1, defense: 1, magicResist: 1, critChance: 0, critDamage: 0, dodge: 0, speed: 0, accuracy: 0 },
            health: { current: preyDataSnapshot.nutritionValue, max: preyDataSnapshot.nutritionValue },
            mana: { current: 0, max: 0 },
            jobs: { activeJobId: 'prey', jobList: [] },
            equipment: {} as any,
            prey: preyDataSnapshot
        };

        const releasedEntity = new Character(newCharacterData as any);
        this.world.addEntity(releasedEntity);

        const combatantComp = CombatantComponent.oneFrom(predator);
        if (combatantComp) {
            this.eventBus.emit('notification', { type: 'warn', message: `${preyDataSnapshot.name} is now free and standing by!` });
        } else {
            console.log(`Entity ${releasedEntity.id} (${(releasedEntity as any).name}) was released to the world.`);
        }
    }

    private onActionTaken(payload: { combatEntityId: string; actorId: string; skillId?: string; targetId?: string; }): void {
        if (payload.skillId !== 'skill_devour_oral') return;

        const predator = this.world.getEntity(parseInt(payload.actorId, 10));
        const prey = this.world.getEntity(parseInt(payload.targetId!, 10));
        const combat = this.world.getEntity(parseInt(payload.combatEntityId, 10));

        if (!predator || !prey || !combat) return;

        const voreComponent = VoreComponent.oneFrom(predator)?.data;
        const preyComponent = PreyComponent.oneFrom(prey);

        if (!voreComponent || !preyComponent) {
            this.eventBus.emit('notification', { type: 'error', message: "Target cannot be devoured." });
            return;
        }

        const targetContainer: VoreContainerType = 'Stomach';
        const stomach = getContainer(voreComponent, targetContainer);
        if (!stomach) return;

        const totalCapacity = stomach.capacity;
        const currentFill = stomach.contents.reduce((sum: number, p: { size: number }) => sum + p.size, 0);

        if (currentFill + preyComponent.data.size > totalCapacity) {
            this.eventBus.emit('notification', { type: 'warn', message: "Your stomach is too full!" });
            return;
        }

        const info = InfoComponent.oneFrom(prey)?.data;
        stomach.contents.push({
            entityId: prey.id,
            name: info?.name || 'Unknown Prey',
            size: preyComponent.data.size,
            digestionTimer: preyComponent.data.digestionTime,
            preyData: { ...preyComponent.data }
        });

        const combatData = CombatComponent.oneFrom(combat)!.data;
        combatData.combatants = combatData.combatants.filter(id => parseInt(id, 10) !== prey.id);
        this.world.removeEntity(prey);

        this.eventBus.emit('preyDevoured', { predatorId: predator.id, preyId: prey.id });
        this.eventBus.emit('notification', { type: 'info', message: `You devoured ${info?.name || 'Unknown Prey'}!` });
    }

    private onTurnStarted(payload: { activeCombatantId: string }): void {
        const predator = this.world.getEntity(parseInt(payload.activeCombatantId, 10));
        if (!predator) return;

        this.processDigestion(predator);
    }

    private onPlayerLocationChanged(payload: { characterId: number }): void {
        const player = this.world.getEntity(payload.characterId);
        if (player) {
            this.processDigestion(player);
        }
    }

    private processDigestion(predator: Entity): void {
        const voreComponent = VoreComponent.oneFrom(predator)?.data;
        if (!voreComponent) return;

        const inCombat = !!CombatantComponent.oneFrom(predator);
        let totalStruggleDamage = 0;

        for (const container of Object.values(voreComponent)) {
            if (!container || !container.contents) continue;
            for (let i = container.contents.length - 1; i >= 0; i--) {
                const prey = container.contents[i];
                const preyData = prey.preyData;

                if (inCombat && Math.random() < STRUGGLE_CHANCE) {
                    const struggleDamage = preyData.strugglePower || 1;
                    totalStruggleDamage += struggleDamage;

                    const predInfo = InfoComponent.oneFrom(predator)?.data;
                    this.eventBus.emit('notification', {
                        type: 'warn',
                        message: `${prey.name} struggles inside ${predInfo ? predInfo.name : 'you'}! (-${struggleDamage} HP)`
                    });
                }

                if (container.digestionRate > 0) {
                    prey.digestionTimer -= container.digestionRate;
                }

                if (prey.digestionTimer <= 0) {
                    this.eventBus.emit('preyDigested', { predatorId: predator.id, digestedPreyData: prey.preyData });
                    container.contents.splice(i, 1);
                }
            }
        }

        if (totalStruggleDamage > 0) {
            const health = HealthComponent.oneFrom(predator)?.data;
            if (health) {
                health.current = Math.max(0, health.current - totalStruggleDamage);
            }
        }

        this.eventBus.emit('playerStateModified', { characterId: predator.id });
    }

    private onPreyDigested(payload: { predatorId: number; digestedPreyData: any }): void {
        const predator = this.world.getEntity(payload.predatorId);
        if (!predator) return;

        const nutrition = payload.digestedPreyData.nutritionValue || 0;
        if (nutrition > 0) {
            const health = HealthComponent.oneFrom(predator)?.data;
            if (health) {
                const amountHealed = Math.min(health.max - health.current, nutrition);
                if (amountHealed > 0) {
                    this.eventBus.emit('healthHealed', {
                        healerId: predator.id.toString(),
                        targetId: predator.id.toString(),
                        amount: amountHealed
                    });
                }
            }
        }

        this.eventBus.emit('notification', { type: 'success', message: `You have digested ${payload.digestedPreyData.name}.` });
        this.eventBus.emit('playerStateModified', { characterId: predator.id });
    }
}


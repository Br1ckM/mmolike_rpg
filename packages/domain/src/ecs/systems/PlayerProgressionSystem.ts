import { Entity } from 'ecs-lib';
import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { ProgressionComponent } from '../components/skill';
import { type GameContent, type GameConfig } from '../../ContentService';
import { GameSystem } from './GameSystem'; // Import the new base class

// A simple formula for XP required for the next level.
const xpForLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

/**
 * Manages character leveling and progression.
 */
export class ProgressionSystem extends GameSystem { // Extend GameSystem
    private config: GameConfig;

    constructor(world: ECS, eventBus: EventBus, loadedContent: GameContent) {
        // This system is event-driven.
        super(world, eventBus, []);
        this.config = loadedContent.config;

        // Use the inherited 'subscribe' method
        this.subscribe('experienceGained', this.onExperienceGained.bind(this));
    }

    private onExperienceGained(payload: { characterId: number; amount: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        if (!character) return;

        const progression = ProgressionComponent.oneFrom(character)?.data;
        if (!progression) return;

        progression.xp += payload.amount;
        console.log(`Character ${character.id} gained ${payload.amount} XP.`);

        let requiredXp = xpForLevel(progression.level);
        while (progression.xp >= requiredXp) {
            progression.level++;
            progression.xp -= requiredXp;
            requiredXp = xpForLevel(progression.level);

            this.onLevelUp(character, progression.level);
        }

        // Notify that the player's state has changed
        this.eventBus.emit('playerStateModified', { characterId: character.id });
    }

    private onLevelUp(character: Entity, newLevel: number): void {
        const coreStatsPerLevel = this.config.player_progression.core_stats_per_level;
        console.log(`Character ${character.id} leveled up to ${newLevel}! They have ${coreStatsPerLevel} stat points to spend.`);

        this.eventBus.emit('playerLeveledUp', {
            characterId: character.id,
            newLevel,
        });
    }
}
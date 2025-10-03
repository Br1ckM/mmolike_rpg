import ECS, { Entity } from 'ecs-lib';
import { EventBus } from '../../domain/src/ecs/EventBus';
import { ContentService, type GameContent } from '../../domain/src/ContentService';
import { Character, type CharacterData } from '../../domain/src/ecs/entities/character';
import { World } from '../../domain/src/ecs/entities/world';
import { WorldClockComponent, type TimeOfDay } from '../../domain/src/ecs/components/world';

// Import all domain systems
import { StatCalculationSystem } from '../../domain/src/ecs/systems/StatCalculationSystem';
import { ItemGenerationSystem } from '../../domain/src/ecs/systems/ItemGenerationSystem';
import { InventorySystem } from '../../domain/src/ecs/systems/InventorySystem';
import { EquipmentSystem } from '../../domain/src/ecs/systems/EquipmentSystem';
import { ConsumableSystem } from '../../domain/src/ecs/systems/ConsumableSystem';
import { QuestLogSystem } from '../../domain/src/ecs/systems/QuestLogSystem';
import { QuestTrackingSystem } from '../../domain/src/ecs/systems/QuestTrackingSystem';
import { QuestRewardSystem } from '../../domain/src/ecs/systems/QuestRewardSystem';
import { QuestStateSystem } from '../../domain/src/ecs/systems/QuestStateSystem';
import { DialogueSystem } from '../../domain/src/ecs/systems/DialogueSystem';
import { VendorSystem } from '../../domain/src/ecs/systems/VendorSystem';
import { TrainerSystem } from '../../domain/src/ecs/systems/TrainerSystem';
import { LootResolutionSystem } from '../../domain/src/ecs/systems/LootResolutionSystem';
import { MobGenSystem } from '../../domain/src/ecs/systems/MobGenSystem';
import { EncounterSystem } from '../../domain/src/ecs/systems/EncounterSystem';
import { TraitSystem } from '../../domain/src/ecs/systems/TraitSystem';
import { WorldClockSystem } from '../../domain/src/ecs/systems/WorldClockSystem';
import { TravelSystem } from '../../domain/src/ecs/systems/TravelSystem';
import { ScheduleSystem } from '../../domain/src/ecs/systems/ScheduleSystem';
import { CombatInitiationSystem } from '../../domain/src/ecs/systems/combat/CombatInitiationSystem';
import { CombatSystem } from '../../domain/src/ecs/systems/combat/CombatSystem';
import { AISystem } from '../../domain/src/ecs/systems/combat/AISystem';
import { StatusEffectSystem } from '../../domain/src/ecs/systems/combat/StatusEffectSystem';

// Import Component types for creating the DTO
import {
    InfoComponent,
    ControllableComponent,
    CoreStatsComponent,
    DerivedStatsComponent,
    EquipmentComponent,
    InventoryComponent,
    ProfessionsComponent,
    HealthComponent,
    SkillBookComponent,
    JobsComponent,
    ManaComponent,
} from '../../domain/src/ecs/components/character';
import { QuestStatusComponent } from '../../domain/src/ecs/components/quest';

/**
 * The GameService is the central orchestrator for the application layer.
 * It is responsible for initializing the entire game world, including the ECS,
 * all domain systems, and loading game content.
 */
export class GameService {
    public world: ECS;
    public eventBus: EventBus;
    public content: GameContent; // It now holds the GameContent object directly
    public player: Character | null = null;
    private systems: any[];

    constructor(contentService: ContentService) {
        this.world = new ECS();
        this.eventBus = new EventBus();
        this.systems = [];
        this.content = contentService as GameContent; // Assign the .data property from the service

        console.log('[LOAD DIAGNOSTIC] GameService constructor received content data. Keys:', Object.keys(this.content));
    }

    /**
     * Initializes all game systems and creates the player character.
     * This method brings the game world to life.
     */
    public startGame(): void {
        console.log('[LOAD DIAGNOSTIC] GameService startGame called.');

        // --- Create World State Entities ---
        const worldEntity = new World();
        worldEntity.add(new WorldClockComponent({ currentTime: 'Morning' }));
        this.world.addEntity(worldEntity);

        const worldState = {
            currentTime: 'Morning' as TimeOfDay,
            playerEntity: null as Entity | null
        };
        this.eventBus.on('timeOfDayChanged', (payload) => {
            worldState.currentTime = payload.newTime;
        });

        // --- System Instantiation ---
        // Pass the 'this.content' object (which is the data) to all systems that need it.
        const statCalculationSystem = new StatCalculationSystem(this.world, this.eventBus, this.content);
        const questLogSystem = new QuestLogSystem(this.world, this.eventBus);
        const mobGenSystem = new MobGenSystem(this.world, this.eventBus, this.content);
        const scheduleSystem = new ScheduleSystem(this.eventBus, worldState);

        this.systems.push(
            statCalculationSystem,
            questLogSystem,
            mobGenSystem,
            scheduleSystem,
            new ItemGenerationSystem(this.world, this.eventBus, this.content),
            new InventorySystem(this.world, this.eventBus),
            new EquipmentSystem(this.world, this.eventBus),
            new ConsumableSystem(this.world, this.eventBus),
            new QuestTrackingSystem(this.world, this.eventBus, questLogSystem),
            new QuestRewardSystem(this.world, this.eventBus),
            new QuestStateSystem(this.world, this.eventBus, this.content),
            new DialogueSystem(this.world, this.eventBus, this.content),
            new VendorSystem(this.world, this.eventBus),
            new TrainerSystem(this.world, this.eventBus),
            new LootResolutionSystem(this.world, this.eventBus, this.content),
            new EncounterSystem(this.world, this.eventBus, this.content, mobGenSystem),
            new TraitSystem(this.world, this.eventBus, this.content),
            new WorldClockSystem(this.world, this.eventBus, worldEntity),
            new TravelSystem(this.world, this.eventBus),
            new CombatInitiationSystem(this.world, this.eventBus),
            new CombatSystem(this.world, this.eventBus, this.content),
            new AISystem(this.world, this.eventBus, this.content),
            new StatusEffectSystem(this.world, this.eventBus, this.content)
        );

        this.world.addSystem(scheduleSystem);

        // --- Player Creation ---
        console.log('[LOAD DIAGNOSTIC] Attempting to access this.content.mobs...');
        if (!this.content.mobs) {
            console.error('[LOAD DIAGNOSTIC] CRITICAL: this.content.mobs is undefined or null RIGHT BEFORE ACCESS.');
        }

        const playerTemplate = this.content.mobs.get('PLAYER_TEMPLATE');
        if (!playerTemplate) {
            throw new Error('Player template could not be found in game content.');
        }

        const playerData: CharacterData = playerTemplate.components;
        this.player = new Character(playerData);
        this.world.addEntity(this.player);
        worldState.playerEntity = this.player;

        // --- Initial State Calculation ---
        statCalculationSystem.update(this.player);

        console.log(`Game started. Player '${this.player.name}' created and added to the world.`);
    }

    /**
     * The main game loop update tick.
     */
    public update(): void {
        this.world.update();
    }

    /**
     * Gets a Data Transfer Object (DTO) representing the current state of the player.
     */
    public getPlayerState(): any {
        if (!this.player) return null;

        return {
            id: this.player.id,
            name: this.player.name,
            isPlayer: this.player.isPlayer(),
            info: InfoComponent.oneFrom(this.player)?.data,
            controllable: ControllableComponent.oneFrom(this.player)?.data,
            coreStats: CoreStatsComponent.oneFrom(this.player)?.data,
            derivedStats: DerivedStatsComponent.oneFrom(this.player)?.data,
            health: HealthComponent.oneFrom(this.player)?.data,
            mana: ManaComponent.oneFrom(this.player)?.data,
            equipment: EquipmentComponent.oneFrom(this.player)?.data,
            inventory: InventoryComponent.oneFrom(this.player)?.data,
            professions: ProfessionsComponent.oneFrom(this.player)?.data,
            skillBook: SkillBookComponent.oneFrom(this.player)?.data,
            jobs: JobsComponent.oneFrom(this.player)?.data,
            quests: QuestStatusComponent.allFrom(this.player).map(c => c.data),
        };
    }
}
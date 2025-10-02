import ECS, { Entity } from 'ecs-lib';
import { EventBus } from '../../domain/src/ecs/EventBus';
import { ContentService, GameContent } from '../../domain/src/ContentService';
import { Character, CharacterData } from '../../domain/src/ecs/entities/character';
import { World } from '../../domain/src/ecs/entities/world';
import { WorldClockComponent, TimeOfDay } from '../../domain/src/ecs/components/world';


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
    JobsComponent
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
    public content: GameContent;
    public player: Character | null = null;

    private systems: any[]; // To hold all instantiated systems

    constructor(contentRootPath: string) {
        // --- 1. Core Setup ---
        this.world = new ECS();
        this.eventBus = new EventBus();
        this.systems = [];

        // --- 2. Content Loading ---
        // The ContentService loads and validates all YAML game data.
        this.content = new ContentService(contentRootPath);
    }

    /**
     * Initializes all game systems and creates the player character.
     * This method brings the game world to life.
     */
    public startGame(): void {
        console.log('Starting game...');

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


        // --- 3. System Instantiation ---
        const statCalculationSystem = new StatCalculationSystem(this.world, this.eventBus, this.content);
        const questLogSystem = new QuestLogSystem(this.world, this.eventBus);
        const mobGenSystem = new MobGenSystem(this.world, this.eventBus, this.content);

        const scheduleSystem = new ScheduleSystem(this.eventBus, worldState);

        this.systems.push(
            statCalculationSystem,
            questLogSystem,
            mobGenSystem,
            scheduleSystem,
            new ItemGenerationSystem(this.world, this.eventBus, this.content as any),
            new InventorySystem(this.world, this.eventBus),
            new EquipmentSystem(this.world, this.eventBus),
            new ConsumableSystem(this.world, this.eventBus),
            new QuestTrackingSystem(this.world, this.eventBus, questLogSystem),
            new QuestRewardSystem(this.world, this.eventBus),
            new QuestStateSystem(this.world, this.eventBus, this.content),
            new DialogueSystem(this.world, this.eventBus, this.content as any),
            new VendorSystem(this.world, this.eventBus),
            new TrainerSystem(this.world, this.eventBus),
            new LootResolutionSystem(this.world, this.eventBus, this.content as any),
            new EncounterSystem(this.world, this.eventBus, this.content, mobGenSystem),
            new TraitSystem(this.world, this.eventBus, this.content),
            new WorldClockSystem(this.world, this.eventBus, worldEntity),
            new TravelSystem(this.world, this.eventBus),
            new CombatInitiationSystem(this.world, this.eventBus),
            new CombatSystem(this.world, this.eventBus, this.content),
            new AISystem(this.world, this.eventBus, this.content),
            new StatusEffectSystem(this.world, this.eventBus, this.content)
        );

        // Register tick-based systems with the ECS world
        this.world.addSystem(scheduleSystem);


        // --- 4. Player Creation ---
        const playerTemplate = this.content.mobs.get('PLAYER_TEMPLATE');
        if (!playerTemplate) {
            throw new Error('Player template could not be found in game content.');
        }

        const playerData: CharacterData = playerTemplate.components;
        this.player = new Character(playerData);
        this.world.addEntity(this.player);
        worldState.playerEntity = this.player; // Make player entity available to systems


        // --- 5. Initial State Calculation ---
        statCalculationSystem.update(this.player);

        console.log(`Game started. Player '${this.player.name}' created and added to the world.`);
    }

    /**
     * The main game loop update tick.
     */
    public update(): void {
        this.world.update();
    }

    // --- Getters for Presentation Layer ---

    /**
     * Gets a Data Transfer Object (DTO) representing the current state of the player.
     * This safely exposes domain data to the presentation layer without leaking domain entities.
     */
    public getPlayerState(): any {
        if (!this.player) return null;

        // FIX: Access components using their static `oneFrom` or `allFrom` methods
        // instead of the private `components` property on the Entity.
        return {
            id: this.player.id,
            name: this.player.name,
            isPlayer: this.player.isPlayer(),
            info: InfoComponent.oneFrom(this.player)?.data,
            controllable: ControllableComponent.oneFrom(this.player)?.data,
            coreStats: CoreStatsComponent.oneFrom(this.player)?.data,
            derivedStats: DerivedStatsComponent.oneFrom(this.player)?.data,
            health: HealthComponent.oneFrom(this.player)?.data,
            equipment: EquipmentComponent.oneFrom(this.player)?.data,
            inventory: InventoryComponent.oneFrom(this.player)?.data,
            professions: ProfessionsComponent.oneFrom(this.player)?.data,
            skillBook: SkillBookComponent.oneFrom(this.player)?.data,
            jobs: JobsComponent.oneFrom(this.player)?.data,
            quests: QuestStatusComponent.allFrom(this.player).map(c => c.data),
        };
    }
}
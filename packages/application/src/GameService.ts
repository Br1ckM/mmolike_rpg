// packages/application/src/GameService.ts

import ECS, { Entity } from 'ecs-lib';
import { EventBus } from '../../domain/src/ecs/EventBus';
import { ContentService, type GameContent } from '../../domain/src/ContentService';
import { Character, type CharacterData } from '../../domain/src/ecs/entities/character';
import { Item, type ItemData } from '../../domain/src/ecs/entities/item'
import { World, Node } from '../../domain/src/ecs/entities/world';
import { WorldClockComponent, type TimeOfDay, NodeComponent } from '../../domain/src/ecs/components/world';
import { Quest, type QuestEntityData } from '../../domain/src/ecs/entities/quest';
import { Skill, type SkillEntityData } from '../../domain/src/ecs/entities/skill';
import { Effect } from '../../domain/src/ecs/entities/effects';
import { type EffectDefinitionData } from '../../domain/src/ecs/components/effects';
import { Trait } from '../../domain/src/ecs/entities/trait';
import { type TraitData } from '../../domain/src/ecs/components/traits';
import { Job, type JobEntityData } from '../../domain/src/ecs/entities/job';


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
import { NPC, type NPCEntityData } from '../../domain/src/ecs/entities/npc';
import { Location, type LocationEntityData } from '../../domain/src/ecs/entities/world';
import { PlayerLocationComponent, ContainerComponent } from '../../domain/src/ecs/components/world';
import { InteractionSystem } from '../../domain/src/ecs/systems/InteractionSystem';
import { CombatComponent, CombatantComponent } from '../../domain/src/ecs/components/combat';


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
    type EquipmentSlot,

} from '../../domain/src/ecs/components/character';
import {
    ItemInfoComponent,
    StackableComponent,
    EquipableComponent,
    AffixesComponent,
    ModsComponent,
    ModSlotsComponent,
    ConsumableComponent,
    CurrencyComponent,
    SlotsComponent,
    QuestItemComponent,
    ReputationComponent,
    VendorValueComponent,
} from '../../domain/src/ecs/components/item';
import { QuestStatusComponent, QuestComponent, QuestObjectiveComponent } from '../../domain/src/ecs/components/quest';
import { LocationComponent } from '../../domain/src/ecs/components/world';
import { DialogueComponent, VendorComponent, TrainerComponent } from '../../domain/src/ecs/components/npc'


// Helper to get all components from an entity using public accessors
const getEntityDTO = (entity: Entity | null) => {
    if (!entity) return null;

    const dto: { [key: string]: any } = { id: entity.id };

    const checkAndAddComponent = (componentType: any, key: string) => {
        const component = componentType.oneFrom(entity);
        if (component) {
            dto[key] = component.data;
        }
    };

    // FIX: Add all character and NPC components to the check
    checkAndAddComponent(InfoComponent, 'InfoComponent');
    checkAndAddComponent(ControllableComponent, 'ControllableComponent');
    checkAndAddComponent(CoreStatsComponent, 'CoreStatsComponent');
    checkAndAddComponent(DerivedStatsComponent, 'DerivedStatsComponent');
    checkAndAddComponent(HealthComponent, 'HealthComponent');
    checkAndAddComponent(DialogueComponent, 'DialogueComponent');
    checkAndAddComponent(VendorComponent, 'VendorComponent');
    checkAndAddComponent(TrainerComponent, 'TrainerComponent');
    checkAndAddComponent(CombatantComponent, 'CombatantComponent');

    // Item Components (keep these)
    checkAndAddComponent(ItemInfoComponent, 'ItemInfoComponent');
    checkAndAddComponent(StackableComponent, 'StackableComponent');
    checkAndAddComponent(EquipableComponent, 'EquipableComponent');
    checkAndAddComponent(SlotsComponent, 'SlotsComponent');
    checkAndAddComponent(CurrencyComponent, 'CurrencyComponent');

    // World Components (keep these)
    checkAndAddComponent(LocationComponent, 'LocationComponent');
    checkAndAddComponent(ContainerComponent, 'ContainerComponent');
    checkAndAddComponent(NodeComponent, 'NodeComponent');

    return dto;
};

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
    private contentIdToEntityIdMap = new Map<string, number>();

    constructor(contentService: ContentService) {
        this.world = new ECS();
        this.eventBus = new EventBus();
        this.systems = [];
        this.content = contentService as GameContent; // Assign the .data property from the service
        this.contentIdToEntityIdMap = new Map<string, number>();

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
        const questLogSystem = new QuestLogSystem(this.world, this.eventBus, this.contentIdToEntityIdMap);
        const mobGenSystem = new MobGenSystem(this.world, this.eventBus, this.content);
        const scheduleSystem = new ScheduleSystem(this.eventBus, worldState);
        const interactionSystem = new InteractionSystem(this.world, this.eventBus)

        this.systems.push(
            statCalculationSystem,
            questLogSystem,
            mobGenSystem,
            scheduleSystem,
            interactionSystem,
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
            new TravelSystem(this.world, this.eventBus, this.contentIdToEntityIdMap),
            new CombatInitiationSystem(this.world, this.eventBus),
            new CombatSystem(this.world, this.eventBus, this.content),
            new AISystem(this.world, this.eventBus, this.content),
            new StatusEffectSystem(this.world, this.eventBus, this.content)
        );

        this.world.addSystem(scheduleSystem);

        if (this.content.skills) {
            const skillEntries = [...this.content.skills.entries()];
            for (const [id, template] of skillEntries) {
                const entity = new Skill((template as any).components as SkillEntityData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
                // Replace raw data with the entity in the content map
                this.content.skills.set(id, entity as any);
            }
        }

        if (this.content.effects) {
            const effectEntries = [...this.content.effects.entries()];
            for (const [id, template] of effectEntries) {
                const entity = new Effect((template as any).components.definition as EffectDefinitionData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
                this.content.effects.set(id, entity as any);
            }
        }

        if (this.content.traits) {
            const traitEntries = [...this.content.traits.entries()];
            for (const [id, template] of traitEntries) {
                const entity = new Trait(template as TraitData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
                this.content.traits.set(id, entity as any);
            }
        }

        if (this.content.jobs) {
            const jobEntries = [...this.content.jobs.entries()];
            for (const [id, template] of jobEntries) {
                const entity = new Job((template as any).components as JobEntityData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
                this.content.jobs.set(id, entity as any);
            }
        }

        // --- Create Location Entities ---
        if (this.content.locations) {
            for (const [id, template] of this.content.locations.entries()) {
                const componentsData = (template as any).components;
                const entity = new Location(componentsData as LocationEntityData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
            }
        }

        // --- Create Node Entities ---
        if (this.content.nodes) {
            for (const [id, template] of this.content.nodes.entries()) {
                const entity = new Node(template.components);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
            }
        }

        // --- Create NPC Entities ---
        if (this.content.mobs) {
            for (const [id, template] of this.content.mobs.entries()) {
                // We'll filter out the player template for this loop
                if (id.startsWith('npc_')) {
                    const entity = new NPC(template.components as NPCEntityData);
                    this.world.addEntity(entity);
                    this.contentIdToEntityIdMap.set(id, entity.id);
                }
            }
        }

        // --- Create Quest Entities ---
        if (this.content.quests) {
            for (const [id, template] of this.content.quests.entries()) {
                const entity = new Quest((template as any).components as QuestEntityData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
            }
        }

        // In Application.ts, all items were merged into baseItems, so we'll look there.
        const staticItems = this.content.baseItems;
        if (staticItems) {
            for (const [id, template] of staticItems.entries()) {
                // We identify inventory containers by checking for these specific components
                if (template.components.slots || template.components.currency) {
                    const itemData: ItemData = template.components;
                    const entity = new Item(itemData);
                    this.world.addEntity(entity);
                    // Map the string ID from the YAML file to the numeric runtime ID
                    this.contentIdToEntityIdMap.set(id, entity.id);
                }
            }
        }

        // --- Player Creation ---
        const playerTemplate = this.content.mobs.get('PLAYER_TEMPLATE');
        if (!playerTemplate) {
            throw new Error('Player template could not be found in game content.');
        }

        // Create a mutable copy of the player data
        const playerData: CharacterData = JSON.parse(JSON.stringify(playerTemplate.components));

        // --- FIX: Replace string IDs with the new numeric entity IDs ---
        if (playerData.inventory) {
            const walletEntityId = this.contentIdToEntityIdMap.get(playerData.inventory.walletId);
            if (walletEntityId) {
                playerData.inventory.walletId = String(walletEntityId);
            }

            playerData.inventory.bagIds = playerData.inventory.bagIds.map(bagContentId => {
                const bagEntityId = this.contentIdToEntityIdMap.get(bagContentId);
                return bagEntityId ? String(bagEntityId) : bagContentId;
            });
        }

        this.player = new Character(playerData);

        this.player.add(new PlayerLocationComponent({
            currentZoneId: String(this.contentIdToEntityIdMap.get('loc_timberbrook_fields')),
            currentSubLocationId: String(this.contentIdToEntityIdMap.get('loc_cloverfell_village')),
        }));

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

        const inventoryComponent = InventoryComponent.oneFrom(this.player)?.data;
        let hydratedInventory = null;

        if (inventoryComponent) {
            // Get wallet data
            const walletEntity = this.world.getEntity(parseInt(inventoryComponent.walletId, 10));
            const walletData = CurrencyComponent.oneFrom(walletEntity!)?.data;

            // Get bags and their items
            const bagsData = inventoryComponent.bagIds.map(bagId => {
                const bagEntity = this.world.getEntity(parseInt(bagId, 10));
                if (!bagEntity) return null;

                const bagSlots = SlotsComponent.oneFrom(bagEntity)?.data;
                const items = bagSlots
                    ? bagSlots.items.map(itemId => {
                        if (!itemId) return null;
                        const itemEntity = this.world.getEntity(parseInt(itemId, 10));
                        return getEntityDTO(itemEntity ?? null); // Get all components for the item
                    })
                    : [];

                return {
                    ...getEntityDTO(bagEntity),
                    items, // Add the hydrated items array
                };
            }).filter(b => b !== null);

            hydratedInventory = {
                wallet: walletData,
                bags: bagsData,
            };
        }

        const hydratedQuests = QuestStatusComponent.allFrom(this.player).map(statusComponent => {
            const questId = this.contentIdToEntityIdMap.get(statusComponent.data.questId);
            if (!questId) return null;

            const questEntity = this.world.getEntity(questId);
            if (!questEntity) return null;

            const questInfo = QuestComponent.oneFrom(questEntity)?.data;
            const questObjectives = QuestObjectiveComponent.oneFrom(questEntity)?.data;

            return {
                ...statusComponent.data, // Contains status and progress
                info: questInfo,         // Contains name, description
                objectives: questObjectives, // Contains objective details
            };
        }).filter(q => q !== null);

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
            inventory: hydratedInventory,
            professions: ProfessionsComponent.oneFrom(this.player)?.data,
            skillBook: SkillBookComponent.oneFrom(this.player)?.data,
            jobs: JobsComponent.oneFrom(this.player)?.data,
            quests: hydratedQuests,
        };
    }

    public getHubState(): any {
        if (!this.player) return null;

        const playerLocation = PlayerLocationComponent.oneFrom(this.player)?.data;
        if (!playerLocation) return null;

        // --- FIX: Get data from BOTH the Zone and the Hub ---

        // 1. Get the Hub entity for its name and its NPCs
        const hubEntity = this.world.getEntity(parseInt(playerLocation.currentSubLocationId, 10));
        const hubData = getEntityDTO(hubEntity || null);
        const hubContainer = hubData?.ContainerComponent;

        // 2. Get the Zone entity for its map nodes
        const zoneEntity = this.world.getEntity(parseInt(playerLocation.currentZoneId, 10));
        const zoneData = getEntityDTO(zoneEntity || null);
        const zoneContainer = zoneData?.ContainerComponent;

        // 3. Process the HUB's container specifically for NPCs
        const npcs = (hubContainer?.containedEntityIds || []).map((contentId: string) => {
            if (!contentId.startsWith('npc_')) return null; // Only process NPCs here
            const entityId = this.contentIdToEntityIdMap.get(contentId);
            if (!entityId) return null;
            const entity = this.world.getEntity(entityId) || null;
            return getEntityDTO(entity);
        }).filter((n: any) => n !== null);

        // 4. Process the ZONE's container specifically for Nodes
        const nodes = (zoneContainer?.containedEntityIds || []).map((contentId: string) => {
            if (!contentId.startsWith('node_')) return null; // Only process Nodes here
            const entityId = this.contentIdToEntityIdMap.get(contentId);
            if (!entityId) return null;
            const entity = this.world.getEntity(entityId) || null;
            return getEntityDTO(entity);
        }).filter((n: any) => n !== null);

        return {
            location: hubData, // Use the Hub's data for the location name
            npcs: npcs,       // The NPCs from the Hub
            nodes: nodes,     // The Nodes from the surrounding Zone
        };
    }

    public getCombatState(): any {
        const entities = (this.world as any).entities || [];
        const combatEntity = entities.find((e: Entity) => CombatComponent.oneFrom(e));
        if (!combatEntity) return null;

        const combatData = CombatComponent.oneFrom(combatEntity)!.data;

        const combatants = combatData.combatants.map(id => {
            const entity = this.world.getEntity(parseInt(id, 10));
            return getEntityDTO(entity || null);
        }).filter(c => c !== null);

        return {
            ...combatData,
            combatants
        };
    }
}
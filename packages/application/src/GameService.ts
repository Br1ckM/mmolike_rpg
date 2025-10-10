// packages/application/src/GameService.ts

import ECS, { Entity } from 'ecs-lib';
import { EventBus } from 'mmolike_rpg-domain/ecs/EventBus';
import { ContentService, type GameContent } from 'mmolike_rpg-domain/ContentService';
import { Character, type CharacterEntityData } from 'mmolike_rpg-domain/ecs/entities/character';
import { Item, type ItemData } from 'mmolike_rpg-domain/ecs/entities/item'
import { World, Node } from 'mmolike_rpg-domain/ecs/entities/world';
import { WorldClockComponent, type TimeOfDay, NodeComponent } from 'mmolike_rpg-domain/ecs/components/world';
import { Quest, type QuestEntityData } from 'mmolike_rpg-domain/ecs/entities/quest';
import { Skill, type SkillEntityData } from 'mmolike_rpg-domain/ecs/entities/skill';
import { Effect } from 'mmolike_rpg-domain/ecs/entities/effects';
import { type EffectDefinitionData } from 'mmolike_rpg-domain/ecs/components/effects';
import { Trait } from 'mmolike_rpg-domain/ecs/entities/trait';
import { type TraitData } from 'mmolike_rpg-domain/ecs/components/traits';
import { Job, type JobEntityData } from 'mmolike_rpg-domain/ecs/entities/job';
import { ProgressionSystem } from 'mmolike_rpg-domain/ecs/systems/PlayerProgressionSystem';


// Import all domain systems
import { StatCalculationSystem } from 'mmolike_rpg-domain/ecs/systems/StatCalculationSystem';
import { ItemGenerationSystem } from 'mmolike_rpg-domain/ecs/systems/ItemGenerationSystem';
import { InventorySystem } from 'mmolike_rpg-domain/ecs/systems/InventorySystem';
import { EquipmentSystem } from 'mmolike_rpg-domain/ecs/systems/EquipmentSystem';
import { ConsumableSystem } from 'mmolike_rpg-domain/ecs/systems/ConsumableSystem';
import { QuestLogSystem } from 'mmolike_rpg-domain/ecs/systems/QuestLogSystem';
import { QuestTrackingSystem } from 'mmolike_rpg-domain/ecs/systems/QuestTrackingSystem';
import { QuestRewardSystem } from 'mmolike_rpg-domain/ecs/systems/QuestRewardSystem';
import { QuestStateSystem } from 'mmolike_rpg-domain/ecs/systems/QuestStateSystem';
import { DialogueSystem } from 'mmolike_rpg-domain/ecs/systems/DialogueSystem';
import { VendorSystem } from 'mmolike_rpg-domain/ecs/systems/VendorSystem';
import { TrainerSystem } from 'mmolike_rpg-domain/ecs/systems/TrainerSystem';
import { LootResolutionSystem } from 'mmolike_rpg-domain/ecs/systems/LootResolutionSystem';
import { MobGenSystem } from 'mmolike_rpg-domain/ecs/systems/MobGenSystem';
import { EncounterSystem } from 'mmolike_rpg-domain/ecs/systems/EncounterSystem';
import { TraitSystem } from 'mmolike_rpg-domain/ecs/systems/TraitSystem';
import { WorldClockSystem } from 'mmolike_rpg-domain/ecs/systems/WorldClockSystem';
import { TravelSystem } from 'mmolike_rpg-domain/ecs/systems/TravelSystem';
import { ScheduleSystem } from 'mmolike_rpg-domain/ecs/systems/ScheduleSystem';
import { VoreSystem } from 'mmolike_rpg-domain/ecs/systems/VoreSystem';
import { CombatInitiationSystem } from 'mmolike_rpg-domain/ecs/systems/combat/CombatInitiationSystem';
import { CombatSystem } from 'mmolike_rpg-domain/ecs/systems/combat/CombatSystem';
import { AISystem } from 'mmolike_rpg-domain/ecs/systems/combat/AISystem';
import { StatusEffectSystem } from 'mmolike_rpg-domain/ecs/systems/combat/StatusEffectSystem';
import { NPC, type NPCEntityData } from 'mmolike_rpg-domain/ecs/entities/npc';
import { Location, type LocationEntityData } from 'mmolike_rpg-domain/ecs/entities/world';
import { PlayerLocationComponent, ContainerComponent } from 'mmolike_rpg-domain/ecs/components/world';
import { InteractionSystem } from 'mmolike_rpg-domain/ecs/systems/InteractionSystem';
import { PartySystem } from 'mmolike_rpg-domain/ecs/systems/PartySystem'
import { CampSystem } from 'mmolike_rpg-domain/ecs/systems/CampSystem'
import { CombatComponent, CombatantComponent } from 'mmolike_rpg-domain/ecs/components/combat';
import { ExplorationSystem } from 'mmolike_rpg-domain/ecs/systems/ExplorationSystem'


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
    ConsumableBeltComponent,
    AppearanceComponent,
    VoreRoleComponent,
    VoreComponent,
    type AppearanceAttribute,
    type VoreRole,
    type EquipmentSlot,

} from 'mmolike_rpg-domain/ecs/components/character';
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
} from 'mmolike_rpg-domain/ecs/components/item';
import { QuestStatusComponent, QuestComponent, QuestObjectiveComponent } from 'mmolike_rpg-domain/ecs/components/quest';
import { LocationComponent } from 'mmolike_rpg-domain/ecs/components/world';
import { DialogueComponent, VendorComponent, TrainerComponent } from 'mmolike_rpg-domain/ecs/components/npc'
import { SkillInfoComponent, SkillComponent, ProgressionComponent } from 'mmolike_rpg-domain/ecs/components/skill';
import { CompanionComponent } from 'mmolike_rpg-domain/ecs/components/npc'

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

    // Character Components
    checkAndAddComponent(InfoComponent, 'InfoComponent');
    checkAndAddComponent(ControllableComponent, 'ControllableComponent');
    checkAndAddComponent(CoreStatsComponent, 'CoreStatsComponent');
    checkAndAddComponent(DerivedStatsComponent, 'DerivedStatsComponent');
    checkAndAddComponent(HealthComponent, 'HealthComponent');
    checkAndAddComponent(ManaComponent, 'ManaComponent');
    checkAndAddComponent(SkillBookComponent, 'SkillBookComponent');
    checkAndAddComponent(DialogueComponent, 'DialogueComponent');
    checkAndAddComponent(VendorComponent, 'VendorComponent');
    checkAndAddComponent(TrainerComponent, 'TrainerComponent');
    checkAndAddComponent(CombatantComponent, 'CombatantComponent');
    checkAndAddComponent(ConsumableBeltComponent, 'ConsumableBeltComponent');
    checkAndAddComponent(ProgressionComponent, 'ProgressionComponent');
    checkAndAddComponent(AppearanceComponent, 'AppearanceComponent');
    checkAndAddComponent(VoreRoleComponent, 'VoreRoleComponent');
    checkAndAddComponent(VoreComponent, 'VoreComponent');
    checkAndAddComponent(CompanionComponent, 'CompanionComponent');

    // Item Components
    checkAndAddComponent(ItemInfoComponent, 'ItemInfoComponent');
    checkAndAddComponent(StackableComponent, 'StackableComponent');
    checkAndAddComponent(EquipableComponent, 'EquipableComponent');
    checkAndAddComponent(SlotsComponent, 'SlotsComponent');
    checkAndAddComponent(CurrencyComponent, 'CurrencyComponent');

    // World Components
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
    public content: GameContent;
    public player: Character | null = null;
    public systems: any[];
    private contentIdToEntityIdMap = new Map<string, number>();
    public settings = {
        showNsfwContent: false,
        showVoreContent: false,
    };

    constructor(contentService: ContentService, eventBus: EventBus) {
        this.world = new ECS();
        this.eventBus = eventBus;
        this.systems = [];
        this.content = contentService as GameContent;
        this.contentIdToEntityIdMap = new Map<string, number>();

        console.log('[LOAD DIAGNOSTIC] GameService constructor received content data. Keys:', Object.keys(this.content));

        this.eventBus.on('updateContentFilter', (settings) => {
            console.log('[GameService] Received filter update:', settings);
            this.settings.showNsfwContent = settings.showNsfwContent;
            this.settings.showVoreContent = settings.showVoreContent;

            if (this.player) {
                this.eventBus.emit('playerStateModified', { characterId: this.player.id });
            }
        });

        this.eventBus.on('characterCreationRequested', (options) => {
            if (this.player) return;

            const playerTemplate = this.content.mobs.get('PLAYER_TEMPLATE');
            if (!playerTemplate) {
                throw new Error('Player template could not be found.');
            }

            const playerData: CharacterEntityData = JSON.parse(JSON.stringify(playerTemplate.components));

            playerData.info.name = options.name;
            (playerData.info as any).pronouns = options.pronouns;
            (playerData.info as any).ancestryId = options.ancestryId;

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

            this.player = new Character(playerData as any);
            this.player.add(new PlayerLocationComponent({
                currentZoneId: String(this.contentIdToEntityIdMap.get('loc_timberbrook_fields')),
                currentSubLocationId: String(this.contentIdToEntityIdMap.get('loc_cloverfell_village')),
            }));

            this.world.addEntity(this.player);

            const statCalcSystem = this.systems.find(s => s instanceof StatCalculationSystem) as StatCalculationSystem;
            if (statCalcSystem) {
                statCalcSystem.update(this.player);
            }

            console.log(`Player '${this.player.name}' created!`);
            this.eventBus.emit('playerStateModified', { characterId: this.player.id });
        });
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
        const statCalculationSystem = new StatCalculationSystem(this.world, this.eventBus, this.content);
        const questLogSystem = new QuestLogSystem(this.world, this.eventBus, this.contentIdToEntityIdMap);
        const mobGenSystem = new MobGenSystem(this.world, this.eventBus, this.content);
        const scheduleSystem = new ScheduleSystem(this.eventBus, worldState);
        const interactionSystem = new InteractionSystem(this.world, this.eventBus);
        const progressionSystem = new ProgressionSystem(this.world, this.eventBus, this.content);
        const voreSystem = new VoreSystem(this.world, this.eventBus);

        this.systems.push(
            statCalculationSystem,
            questLogSystem,
            mobGenSystem,
            scheduleSystem,
            interactionSystem,
            progressionSystem,
            voreSystem,
            new PartySystem(this.world, this.eventBus, this.contentIdToEntityIdMap),
            new ItemGenerationSystem(this.world, this.eventBus, this.content),
            new InventorySystem(this.world, this.eventBus),
            new EquipmentSystem(this.world, this.eventBus),
            new ConsumableSystem(this.world, this.eventBus),
            new QuestTrackingSystem(this.world, this.eventBus, questLogSystem, this.contentIdToEntityIdMap),
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
            new CombatSystem(this.world, this.eventBus, this.content, this.contentIdToEntityIdMap),
            new AISystem(this.world, this.eventBus, this.content, this.contentIdToEntityIdMap),
            new StatusEffectSystem(this.world, this.eventBus, this.content),
            new CampSystem(this.world, this.eventBus),
            new ExplorationSystem(this.world, this.eventBus, this.contentIdToEntityIdMap),
        );

        this.world.addSystem(scheduleSystem);

        if (this.content.skills) {
            const skillEntries = [...this.content.skills.entries()];
            for (const [id, template] of skillEntries) {
                const entity = new Skill((template as any).components as SkillEntityData);
                this.world.addEntity(entity);
                // Diagnostic: log component registration identity to help catch duplicate module instances
                try {
                    console.log(`[GameService] Created skill entity for content id '${id}' -> entity ${entity.id}. SkillComponent ref:`, SkillComponent);
                    console.log(`[GameService] SkillComponent.oneFrom(entity) =>`, SkillComponent.oneFrom(entity));
                    console.log(`[GameService] SkillInfoComponent.oneFrom(entity) =>`, SkillInfoComponent.oneFrom(entity));
                } catch (err) {
                    console.warn('[GameService] Diagnostic logging for skill entity failed:', err);
                }
                this.contentIdToEntityIdMap.set(id, entity.id);
            }
        }

        if (this.content.effects) {
            const effectEntries = [...this.content.effects.entries()];
            for (const [id, template] of effectEntries) {
                const entity = new Effect((template as any).components.definition as EffectDefinitionData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
            }
        }

        if (this.content.traits) {
            const traitEntries = [...this.content.traits.entries()];
            for (const [id, template] of traitEntries) {
                const entity = new Trait(template as TraitData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
            }
        }

        if (this.content.jobs) {
            const jobEntries = [...this.content.jobs.entries()];
            for (const [id, template] of jobEntries) {
                const entity = new Job((template as any).components as JobEntityData);
                this.world.addEntity(entity);
                this.contentIdToEntityIdMap.set(id, entity.id);
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
                if (id.startsWith('npc_')) {
                    const npcData = template.components as NPCEntityData;
                    npcData.info.id = id;
                    const entity = new NPC(npcData);
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

        const staticItems = this.content.baseItems;
        if (staticItems) {
            for (const [id, template] of staticItems.entries()) {
                if (template.components.slots || template.components.currency) {
                    const itemData: ItemData = template.components;
                    const entity = new Item(itemData);
                    this.world.addEntity(entity);
                    this.contentIdToEntityIdMap.set(id, entity.id);
                }
            }
        }
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

        const playerDTO = getEntityDTO(this.player) as any;
        if (!playerDTO) return null;

        const allEntities = (this.world as any).entities as Entity[];
        const companions = allEntities
            .filter(e => {
                const comp = CompanionComponent.oneFrom(e)?.data;
                return comp && comp.recruited;
            })
            .map(e => getEntityDTO(e));

        playerDTO.companions = companions;

        const inventoryComponent = playerDTO.InventoryComponent;
        if (inventoryComponent) {
            const walletEntity = this.world.getEntity(parseInt(inventoryComponent.walletId, 10));
            const bagsData = inventoryComponent.bagIds.map((bagId: string) => {
                const bagEntity = this.world.getEntity(parseInt(bagId, 10));
                if (!bagEntity) return null;
                const bagDTO = getEntityDTO(bagEntity) as any;
                if (bagDTO && bagDTO.SlotsComponent) {
                    bagDTO.items = bagDTO.SlotsComponent.items.map((itemId: string | null) =>
                        itemId ? getEntityDTO(this.world.getEntity(parseInt(itemId, 10)) || null) : null
                    );
                }
                return bagDTO;
            }).filter((b: any) => b !== null);

            playerDTO.inventory = {
                wallet: getEntityDTO(walletEntity || null)?.CurrencyComponent,
                bags: bagsData,
            };
            delete playerDTO.InventoryComponent;
        }

        const questStatusComponents = QuestStatusComponent.allFrom(this.player);
        playerDTO.quests = questStatusComponents.map(statusComponent => {
            const questEntityId = this.contentIdToEntityIdMap.get(statusComponent.data.questId);
            if (!questEntityId) return null;
            const questEntity = this.world.getEntity(questEntityId);
            if (!questEntity) return null;
            return {
                ...statusComponent.data,
                info: QuestComponent.oneFrom(questEntity)?.data,
                objectives: QuestObjectiveComponent.oneFrom(questEntity)?.data,
            };
        }).filter(q => q !== null);

        const skillBookComponent = playerDTO.SkillBookComponent;
        if (skillBookComponent) {
            const hydratedSkills = skillBookComponent.knownSkills.map((skillId: string) => {
                const numericSkillId = this.contentIdToEntityIdMap.get(skillId);
                const skillEntity = numericSkillId ? this.world.getEntity(numericSkillId) : undefined;
                if (!skillEntity) return null;
                const info = SkillInfoComponent.oneFrom(skillEntity)?.data;
                const skill = SkillComponent.oneFrom(skillEntity)?.data;
                const progression = ProgressionComponent.oneFrom(skillEntity)?.data;
                return {
                    id: skillId,
                    name: info?.name || 'Unknown',
                    description: info?.description || '',
                    type: skill?.type || 'unknown',
                    icon: `pi ${info?.iconName ? `pi-${info.iconName.toLowerCase()}` : 'pi-question'}`,
                    rank: progression?.level || 1,
                };
            }).filter((s: any) => s !== null);
            playerDTO.skillBook = { knownSkills: hydratedSkills };
        }

        const voreComponent = playerDTO.VoreComponent;
        if (voreComponent) {
            const allContents: any[] = [];
            for (const [voreType, stomach] of Object.entries(voreComponent as any)) {
                const s = stomach as { contents: any[] };
                s.contents.forEach((prey: any) => {
                    allContents.push({
                        name: prey.name,
                        digestionTimer: prey.digestionTimer,
                        voreType: voreType.charAt(0).toUpperCase() + voreType.slice(1)
                    });
                });
            }
            playerDTO.vore = { contents: allContents };
            delete playerDTO.VoreComponent;
        }

        if (playerDTO.AppearanceComponent) {
            playerDTO.AppearanceComponent.attributes = playerDTO.AppearanceComponent.attributes.filter(
                (attr: AppearanceAttribute) => {
                    if (attr.isExtreme) return this.settings.showNsfwContent && this.settings.showVoreContent;
                    if (attr.isSensitive) return this.settings.showNsfwContent;
                    return true;
                }
            );
        }

        const ancestryData = playerDTO.InfoComponent?.ancestryId
            ? (this.content as any).ancestries?.get(playerDTO.InfoComponent.ancestryId)
            : null;

        const finalCoreStats = { ...playerDTO.CoreStatsComponent };
        if (ancestryData?.statModifiers) {
            finalCoreStats.strength += ancestryData.statModifiers.strength || 0;
            finalCoreStats.dexterity += ancestryData.statModifiers.dexterity || 0;
            finalCoreStats.intelligence += ancestryData.statModifiers.intelligence || 0;
        }

        const finalState = {
            id: playerDTO.id,
            name: playerDTO.InfoComponent?.name,
            health: playerDTO.HealthComponent,
            mana: playerDTO.ManaComponent,
            coreStats: finalCoreStats,
            derivedStats: playerDTO.DerivedStatsComponent,
            progression: playerDTO.ProgressionComponent,
            equipment: playerDTO.EquipmentComponent,
            inventory: playerDTO.inventory,
            quests: playerDTO.quests,
            skillBook: playerDTO.skillBook,
            vore: playerDTO.vore,
            ancestry: ancestryData,
            AppearanceComponent: playerDTO.AppearanceComponent,
            VoreRoleComponent: playerDTO.VoreRoleComponent,
            consumableBelt: playerDTO.ConsumableBeltComponent,
            companions: playerDTO.companions,
        };

        return finalState;
    }

    public getHubState(): any {
        if (!this.player) return null;

        const playerLocation = PlayerLocationComponent.oneFrom(this.player)?.data;
        if (!playerLocation) return null;

        const hubEntity = this.world.getEntity(parseInt(playerLocation.currentSubLocationId, 10));
        const hubData = getEntityDTO(hubEntity || null);
        const hubContainer = hubData?.ContainerComponent;

        const zoneEntity = this.world.getEntity(parseInt(playerLocation.currentZoneId, 10));
        const zoneData = getEntityDTO(zoneEntity || null);
        const zoneContainer = zoneData?.ContainerComponent;

        const npcs = (hubContainer?.containedEntityIds || []).map((contentId: string) => {
            if (!contentId.startsWith('npc_')) return null;
            const entityId = this.contentIdToEntityIdMap.get(contentId);
            if (!entityId) return null;
            const entity = this.world.getEntity(entityId) || null;
            return getEntityDTO(entity);
        }).filter((n: any) => n !== null);

        const nodes = (zoneContainer?.containedEntityIds || []).map((contentId: string) => {
            if (!contentId.startsWith('node_')) return null;
            const entityId = this.contentIdToEntityIdMap.get(contentId);
            if (!entityId) return null;
            const entity = this.world.getEntity(entityId) || null;
            return getEntityDTO(entity);
        }).filter((n: any) => n !== null);

        return {
            zoneId: playerLocation.currentZoneId,
            location: hubData,
            npcs: npcs,
            nodes: nodes,
        };
    }

    public getCombatState(): any {
        const entities = (this.world as any).entities || [];
        const combatEntity = entities.find((e: Entity) => CombatComponent.oneFrom(e));
        if (!combatEntity) return null;

        const combatData = CombatComponent.oneFrom(combatEntity)!.data;

        const combatants = combatData.combatants.map(id => {
            const entity = this.world.getEntity(parseInt(id, 10));
            const combatantDTO = getEntityDTO(entity || null);

            if (combatantDTO && combatantDTO.SkillBookComponent) {
                const hydratedSkills = combatantDTO.SkillBookComponent.knownSkills.map((skillId: any) => {

                    if (typeof skillId !== 'string') {
                        return skillId;
                    }

                    const numericSkillId = this.contentIdToEntityIdMap.get(skillId);
                    const skillEntity = numericSkillId ? this.world.getEntity(numericSkillId) : undefined;

                    if (!skillEntity) {
                        return { id: skillId, name: 'Unknown Skill', description: '', costs: [] };
                    }

                    const info = SkillInfoComponent.oneFrom(skillEntity as unknown as Entity)?.data;
                    const skill = SkillComponent.oneFrom(skillEntity as unknown as Entity)?.data;
                    const firstEffectTarget = skill?.effects?.[0]?.target || 'Enemy';

                    return {
                        id: skillId,
                        name: info?.name || 'Unnamed Skill',
                        description: info?.description || '',
                        costs: skill?.costs || [],
                        target: firstEffectTarget,
                    };
                });
                combatantDTO.SkillBookComponent.hydratedSkills = hydratedSkills;
            }

            return combatantDTO;
        }).filter(c => c !== null);

        return {
            combatEntityId: combatEntity.id.toString(),
            ...combatData,
            combatants
        };
    }

    public getStaticContent(key: keyof GameContent): any[] {
        const contentMap = this.content[key];
        if (contentMap instanceof Map) {
            return Array.from(contentMap.values());
        }
        // Handle the 'mobs' case specifically if needed, or other non-map content
        if (key === 'mobs' && contentMap instanceof Map) {
            return Array.from(contentMap.values());
        }
        return [];
    }

    /**
     * Dev helper: generate a mob preview DTO without adding it to the world.
     * Returns the same shape as getEntityDTO for easy inspection in the UI.
     */
    public generateMobPreview(protoId: string, level: number): any | null {
        // Find the MobGenSystem if it was instantiated
        const mobGenSystem = this.systems.find((s: any) => s && s.constructor && s.constructor.name === 'MobGenSystem');
        if (!mobGenSystem) {
            console.warn('[GameService] generateMobPreview: MobGenSystem not found.');
            return null;
        }

        try {
            const mobEntity = mobGenSystem.generateMob(protoId, level);
            // Reuse existing helper
            return getEntityDTO(mobEntity as any);
        } catch (err) {
            console.error('[GameService] generateMobPreview failed:', err);
            return null;
        }
    }
}
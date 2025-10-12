import { EventEmitter } from 'events';
import getEntityDTO from './utils/getEntityDTO';
import type { IGameService } from '../types/IGameService';
import type { PlayerState, HubState, CombatState } from '../types/game';

/**
 * Enhanced GameService that orchestrates game world state and systems.
 * 
 * This service acts as the primary interface between the application layer
 * and the domain layer, managing game initialization, state queries, and
 * event coordination in a modular fashion.
 */
export class GameService implements IGameService {
    private emitter = new EventEmitter();
    private isInitialized = false;

    // Core modules (lazy-loaded for better modularity)
    private worldModule?: any;
    private playerModule?: any;
    private combatModule?: any;
    private persistenceModule?: any;

    constructor() {
        this.setupEventForwarding();
    }

    // =================== IGameService Implementation ===================

    async init(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await this.initializeModules();
            this.isInitialized = true;
            this.emit('gameServiceInitialized', {});
        } catch (error) {
            console.error('[GameService] Initialization failed:', error);
            throw error;
        }
    }

    async start(): Promise<void> {
        if (!this.isInitialized) {
            await this.init();
        }

        await Promise.all([
            this.worldModule?.start?.(),
            this.playerModule?.start?.(),
            this.combatModule?.start?.()
        ]);

        this.emit('gameServiceStarted', {});
    }

    async stop(): Promise<void> {
        await Promise.all([
            this.worldModule?.stop?.(),
            this.playerModule?.stop?.(),
            this.combatModule?.stop?.()
        ]);

        this.isInitialized = false;
        this.emit('gameServiceStopped', {});
    }

    subscribe<T = any>(topic: string, handler: (payload: T) => void): () => void {
        this.emitter.on(topic, handler as any);
        return () => this.emitter.off(topic, handler as any);
    }

    // Compatibility helpers that match the IGameService event adapter surface
    on<T = any>(topic: string, handler: (payload: T) => void): void {
        this.emitter.on(topic, handler as any);
    }

    off<T = any>(topic: string, handler: (payload: T) => void): void {
        this.emitter.off(topic, handler as any);
    }

    emit<T = any>(topic: string, payload: T): void {
        this.emitter.emit(topic, payload);
    }

    selectDialogueResponse(index: number) {
        // default behaviour: emit an event so other systems can react
        this.emit('dialogueResponseSelected', { index });
    }

    /**
     * A guarded port of the legacy getPlayerState DTO builder.
     * This will return `null` if the GameService instance doesn't have a
     * populated `world`/`player` or if domain component modules are not
     * available at runtime. It dynamically requires domain modules to avoid
     * compile-time coupling.
     */
    getPlayerState(playerId?: string): PlayerState | null {
        // Use modular approach first, fall back to legacy implementation
        if (this.playerModule?.getPlayerState) {
            try {
                return this.playerModule.getPlayerState(playerId);
            } catch (error) {
                console.error('[GameService] Player module failed:', error);
            }
        }

        // Legacy implementation with dynamic requires as fallback
        try {
            const testModules = (this as any)._testModules;
            // Require domain components at runtime (guarded)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const charComps = testModules?.character ?? require('mmolike_rpg-domain/ecs/components/character');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const itemComps = testModules?.item ?? require('mmolike_rpg-domain/ecs/components/item');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const questComps = testModules?.quest ?? require('mmolike_rpg-domain/ecs/components/quest');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const skillComps = testModules?.skill ?? require('mmolike_rpg-domain/ecs/components/skill');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { CompanionComponent, EquipmentComponent, CombatComponent, InfoComponent } = charComps as any;
            const { QuestStatusComponent, QuestComponent, QuestObjectiveComponent } = questComps as any;
            const { SkillInfoComponent, SkillComponent, ProgressionComponent } = skillComps as any;

            // Normalize playerId: accept string form (per IGameService) and convert to numeric id when needed
            const numericPlayerId = playerId != null ? (parseInt(playerId as any, 10) || undefined) : undefined;

            // Ensure we have a world and a player entity
            const world = (this as any).world;
            let playerEntity = (this as any).player;
            if (!world || !playerEntity) {
                // Try to resolve by provided playerId if available
                if (numericPlayerId != null && world && typeof world.getEntity === 'function') {
                    playerEntity = world.getEntity(numericPlayerId as any);
                }
            }
            if (!playerEntity) return null;

            // Build the base DTO using the shared helper. Provide a set of common components.
            const components = [
                { accessor: charComps.InfoComponent, key: 'InfoComponent' },
                { accessor: charComps.ControllableComponent, key: 'ControllableComponent' },
                { accessor: charComps.CoreStatsComponent, key: 'CoreStatsComponent' },
                { accessor: charComps.DerivedStatsComponent, key: 'DerivedStatsComponent' },
                { accessor: charComps.HealthComponent, key: 'HealthComponent' },
                { accessor: charComps.ManaComponent, key: 'ManaComponent' },
                { accessor: charComps.SkillBookComponent, key: 'SkillBookComponent' },
                { accessor: charComps.DialogueComponent, key: 'DialogueComponent' },
                { accessor: charComps.VendorComponent, key: 'VendorComponent' },
                { accessor: charComps.TrainerComponent, key: 'TrainerComponent' },
                { accessor: charComps.ConsumableBeltComponent, key: 'ConsumableBeltComponent' },
                { accessor: charComps.ProgressionComponent, key: 'ProgressionComponent' },
                { accessor: charComps.AppearanceComponent, key: 'AppearanceComponent' },
                { accessor: charComps.VoreRoleComponent, key: 'VoreRoleComponent' },
                { accessor: charComps.VoreComponent, key: 'VoreComponent' },
                { accessor: charComps.CompanionComponent, key: 'CompanionComponent' },
                { accessor: charComps.InventoryComponent, key: 'InventoryComponent' },
            ];

            const playerDTO: any = getEntityDTO(playerEntity, components as any) || {};

            // Hydrate companions
            const allEntities = (world as any).entities as any[] || [];
            const companions = allEntities
                .filter(e => {
                    const comp = CompanionComponent.oneFrom(e)?.data;
                    return comp && comp.recruited;
                })
                .map(e => getEntityDTO(e, components as any));
            playerDTO.companions = companions;

            // Inventory handling
            const inventoryComponent = playerDTO.InventoryComponent;
            if (inventoryComponent) {
                const walletEntity = world.getEntity(parseInt(inventoryComponent.walletId, 10));
                const bagsData = (inventoryComponent.bagIds || []).map((bagId: string) => {
                    const bagEntity = world.getEntity(parseInt(bagId, 10));
                    if (!bagEntity) return null;
                    const bagDTO = getEntityDTO(bagEntity, [
                        { accessor: itemComps.SlotsComponent, key: 'SlotsComponent' },
                    ] as any);
                    if (bagDTO && bagDTO.SlotsComponent) {
                        bagDTO.items = (bagDTO.SlotsComponent.items || []).map((itemId: string | null) =>
                            itemId ? getEntityDTO(world.getEntity(parseInt(itemId, 10)), [
                                { accessor: itemComps.ItemInfoComponent, key: 'ItemInfoComponent' },
                                { accessor: itemComps.StackableComponent, key: 'StackableComponent' },
                                { accessor: itemComps.EquipableComponent, key: 'EquipableComponent' },
                                { accessor: itemComps.AffixesComponent, key: 'AffixesComponent' },
                                { accessor: itemComps.ModsComponent, key: 'ModsComponent' },
                                { accessor: itemComps.ModSlotsComponent, key: 'ModSlotsComponent' },
                            ] as any) : null
                        );
                    }
                    return bagDTO;
                }).filter((b: any) => b !== null);

                playerDTO.inventory = {
                    wallet: getEntityDTO(walletEntity, [{ accessor: itemComps.CurrencyComponent, key: 'CurrencyComponent' } as any])?.CurrencyComponent,
                    bags: bagsData,
                };
                delete playerDTO.InventoryComponent;
            }

            // Quests
            const questStatusComponents = QuestStatusComponent ? QuestStatusComponent.allFrom(playerEntity) : [];
            playerDTO.quests = (questStatusComponents || []).map((statusComponent: any) => {
                const questEntityId = (this as any).contentIdToEntityIdMap?.get(statusComponent.data.questId);
                if (!questEntityId) return null;
                const questEntity = world.getEntity(questEntityId);
                if (!questEntity) return null;
                return {
                    ...statusComponent.data,
                    info: QuestComponent.oneFrom(questEntity)?.data,
                    objectives: QuestObjectiveComponent.oneFrom(questEntity)?.data,
                };
            }).filter((q: any) => q !== null);

            // SkillBook hydration
            const skillBookComponent = playerDTO.SkillBookComponent;
            if (skillBookComponent) {
                const hydratedSkills = (skillBookComponent.knownSkills || []).map((skillId: string) => {
                    const numericSkillId = (this as any).contentIdToEntityIdMap?.get(skillId);
                    const skillEntity = numericSkillId ? world.getEntity(numericSkillId) : undefined;
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

            // Vore contents processing
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

            // Appearance filtering is domain-specific; attempt to apply settings if available
            if (playerDTO.AppearanceComponent && (this as any).settings) {
                playerDTO.AppearanceComponent.attributes = (playerDTO.AppearanceComponent.attributes || []).filter(
                    (attr: any) => {
                        if (attr.isExtreme) return (this as any).settings.showNsfwContent && (this as any).settings.showVoreContent;
                        if (attr.isSensitive) return (this as any).settings.showNsfwContent;
                        return true;
                    }
                );
            }

            // Equipment hydration
            const equipmentComp = EquipmentComponent ? EquipmentComponent.oneFrom(playerEntity) : null;
            const equipmentData = equipmentComp ? (equipmentComp.data as Record<string, string | number | null>) : {};
            const equippedItemsData: { [key: string]: any } = {};

            Object.entries(equipmentData || {}).forEach(([slotType, itemEntityId]) => {
                if (itemEntityId !== null && itemEntityId !== undefined && itemEntityId !== '') {
                    const numericId = typeof itemEntityId === 'string' ? parseInt(itemEntityId, 10) : (itemEntityId as number);
                    const itemEntity = world.getEntity(numericId);
                    if (itemEntity) {
                        equippedItemsData[slotType] = getEntityDTO(itemEntity, [
                            { accessor: itemComps.ItemInfoComponent, key: 'ItemInfoComponent' },
                            { accessor: itemComps.StackableComponent, key: 'StackableComponent' },
                            { accessor: itemComps.EquipableComponent, key: 'EquipableComponent' },
                            { accessor: itemComps.AffixesComponent, key: 'AffixesComponent' },
                            { accessor: itemComps.ModsComponent, key: 'ModsComponent' },
                        ] as any);
                    }
                }
            });

            const finalCoreStats = { ...(playerDTO.CoreStatsComponent || {}) };
            const ancestryData = playerDTO.InfoComponent?.ancestryId ? (this as any).content?.ancestries?.get(playerDTO.InfoComponent.ancestryId) : null;
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
                equipment: equipmentData || {},
                equippedItems: equippedItemsData,
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
        } catch (err) {
            // If any domain modules are missing or unexpected errors occur, return null to remain safe.
            return null;
        }
    }

    /**
     * Guarded port of legacy getHubState. Returns null if data or domain modules
     * are unavailable at runtime.
     */
    getHubState(playerId?: string): HubState | null {
        // Use modular approach first
        if (this.worldModule?.getHubState) {
            try {
                return this.worldModule.getHubState(playerId);
            } catch (error) {
                console.error('[GameService] World module failed:', error);
            }
        }

        // Legacy implementation as fallback
        try {
            const testModules = (this as any)._testModules;
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const worldComps = testModules?.world ?? require('mmolike_rpg-domain/ecs/components/world');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const npcComps = testModules?.npc ?? require('mmolike_rpg-domain/ecs/components/npc');

            const PlayerLocationComponent = worldComps.PlayerLocationComponent;

            // IGameService.getHubState has no parameter; prefer the registered player entity.
            if (!(this as any).player) return null;

            const playerEntity = (this as any).player;
            if (!playerEntity) return null;

            const playerLocation = PlayerLocationComponent.oneFrom(playerEntity)?.data;
            if (!playerLocation) return null;

            const world = (this as any).world;
            const hubEntity = world.getEntity(parseInt(playerLocation.currentSubLocationId, 10));
            const hubData = getEntityDTO(hubEntity || null, [{ accessor: worldComps.ContainerComponent, key: 'ContainerComponent' }] as any);
            const hubContainer = hubData?.ContainerComponent;

            const zoneEntity = world.getEntity(parseInt(playerLocation.currentZoneId, 10));
            const zoneData = getEntityDTO(zoneEntity || null, [{ accessor: worldComps.ContainerComponent, key: 'ContainerComponent' }] as any);
            const zoneContainer = zoneData?.ContainerComponent;

            const npcs = (hubContainer?.containedEntityIds || []).map((contentId: string) => {
                if (!contentId.startsWith('npc_')) return null;
                const entityId = (this as any).contentIdToEntityIdMap.get(contentId);
                if (!entityId) return null;
                const entity = world.getEntity(entityId) || null;
                return getEntityDTO(entity);
            }).filter((n: any) => n !== null);

            const nodes = (zoneContainer?.containedEntityIds || []).map((contentId: string) => {
                if (!contentId.startsWith('node_')) return null;
                const entityId = (this as any).contentIdToEntityIdMap.get(contentId);
                if (!entityId) return null;
                const entity = world.getEntity(entityId) || null;
                return getEntityDTO(entity);
            }).filter((n: any) => n !== null);

            return {
                zoneId: playerLocation.currentZoneId,
                location: hubData,
                npcs,
                nodes,
            };
        } catch (err) {
            return null;
        }
    }

    /**
     * Guarded port of legacy getCombatState.
     */
    getCombatState(combatId?: string): CombatState | null {
        // Use modular approach first
        if (this.combatModule?.getCombatState) {
            try {
                return this.combatModule.getCombatState(combatId);
            } catch (error) {
                console.error('[GameService] Combat module failed:', error);
            }
        }

        // Legacy implementation as fallback
        try {
            const testModules = (this as any)._testModules;
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const charComps = testModules?.character ?? require('mmolike_rpg-domain/ecs/components/character');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const combatComps = testModules?.combat ?? require('mmolike_rpg-domain/ecs/components/combat');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const skillComps = testModules?.skill ?? require('mmolike_rpg-domain/ecs/components/skill');

            const CombatComponent = combatComps.CombatComponent;
            const SkillInfoComponent = skillComps.SkillInfoComponent;
            const SkillComponent = skillComps.SkillComponent;

            const world = (this as any).world;
            const entities = (world as any).entities || [];

            const combatEntity = entities.find((e: any) => CombatComponent.oneFrom(e));
            if (!combatEntity) return null;

            const combatData = CombatComponent.oneFrom(combatEntity).data;

            const components = [
                { accessor: charComps.InfoComponent, key: 'InfoComponent' },
                { accessor: charComps.SkillBookComponent, key: 'SkillBookComponent' },
            ];

            const combatants = (combatData.combatants || []).map((id: any) => {
                const entity = world.getEntity(parseInt(id, 10));
                const combatantDTO = getEntityDTO(entity || null, components as any);

                if (combatantDTO && combatantDTO.SkillBookComponent) {
                    const hydratedSkills = (combatantDTO.SkillBookComponent.knownSkills || []).map((skillId: any) => {
                        if (typeof skillId !== 'string') return skillId;
                        const numericSkillId = (this as any).contentIdToEntityIdMap.get(skillId);
                        const skillEntity = numericSkillId ? world.getEntity(numericSkillId) : undefined;
                        if (!skillEntity) return { id: skillId, name: 'Unknown Skill', description: '', costs: [] };

                        const info = SkillInfoComponent.oneFrom(skillEntity)?.data;
                        const skill = SkillComponent.oneFrom(skillEntity)?.data;
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
            }).filter((c: any) => c !== null);

            return {
                combatEntityId: combatEntity.id?.toString?.() ?? null,
                ...combatData,
                combatants,
            };
        } catch (err) {
            return null;
        }
    }

    // =================== Game Actions ===================

    createCharacter(options: any): void {
        this.emit('characterCreationRequested', options);
    }

    saveGame(): void {
        if (this.persistenceModule?.save) {
            this.persistenceModule.save();
        } else {
            this.emit('saveGameRequested', {});
        }
    }

    loadGame(): void {
        if (this.persistenceModule?.load) {
            this.persistenceModule.load();
        } else {
            this.emit('loadGameRequested', {});
        }
    }

    // =================== Development/Debug Methods ===================

    getStaticContent(key: string): any[] {
        if (this.worldModule?.getStaticContent) {
            return this.worldModule.getStaticContent(key);
        }
        return [];
    }

    generateMobPreview(protoId: string, level: number): any | null {
        if (this.combatModule?.generateMobPreview) {
            return this.combatModule.generateMobPreview(protoId, level);
        }

        // Fallback for dev / test scenarios: if a test content service was attached
        // to this GameService instance (e.g. (gameService as any)._testContentService = contentService),
        // attempt to build a minimal preview DTO from that content.
        try {
            const testContent = (this as any)._testContentService;
            if (!testContent) return null;

            // Support both Map-backed and plain-object content shapes
            let proto: any = null;
            if (testContent.mobs instanceof Map) {
                proto = testContent.mobs.get(protoId);
            } else if (Array.isArray(testContent.mobs)) {
                proto = testContent.mobs.find((m: any) => m.id === protoId || m.contentId === protoId);
            } else if (testContent.mobs && typeof testContent.mobs === 'object') {
                proto = testContent.mobs[protoId] ?? null;
            }

            if (!proto) return null;

            // Try to extract simple fields commonly available in content entries.
            const info = proto.components?.InfoComponent?.data ?? proto.info ?? proto.data ?? proto;
            const coreStats = proto.components?.CoreStatsComponent?.data ?? proto.components?.CoreStatsComponent ?? null;

            return {
                protoId,
                level,
                name: info?.name ?? info?.displayName ?? protoId,
                description: info?.description ?? null,
                coreStats: coreStats ?? null,
                // keep raw proto for advanced inspection
                proto,
            };
        } catch (err) {
            return null;
        }
    }

    dealDamageToPlayer(characterId: string, amount: number): void {
        this.emit('dev_dealDamageToPlayer', { characterId, amount });
    }

    // =================== Private Methods ===================

    private async initializeModules(): Promise<void> {
        try {
            // Try to load the rich domain-based modules
            const domainLoader = this.createDomainModuleLoader();

            this.worldModule = await domainLoader.loadWorldModule();
            this.playerModule = await domainLoader.loadPlayerModule();
            this.combatModule = await domainLoader.loadCombatModule();
            this.persistenceModule = await domainLoader.loadPersistenceModule();

            console.log('[GameService] Domain modules loaded successfully');
        } catch (error) {
            console.warn('[GameService] Domain modules unavailable, using stubs:', error);
            this.loadStubModules();
        }
    }

    private createDomainModuleLoader() {
        return {
            async loadWorldModule() {
                const module = await import('../domains/world/WorldModule');
                // Try to create from Application if available, otherwise plain constructor
                if (typeof module.WorldModule.fromApplication === 'function') {
                    const app = (globalThis as any).__gameApp;
                    if (app) return module.WorldModule.fromApplication(app);
                }
                return new module.WorldModule();
            },

            async loadPlayerModule() {
                const module = await import('../domains/player/PlayerModule');
                if (typeof module.PlayerModule.fromApplication === 'function') {
                    const app = (globalThis as any).__gameApp;
                    if (app) return module.PlayerModule.fromApplication(app);
                }
                return new module.PlayerModule();
            },

            async loadCombatModule() {
                const module = await import('../domains/combat/CombatModule');
                if (typeof module.CombatModule.fromApplication === 'function') {
                    const app = (globalThis as any).__gameApp;
                    if (app) return module.CombatModule.fromApplication(app);
                }
                return new module.CombatModule();
            },

            async loadPersistenceModule() {
                const module = await import('../domains/persistence/PersistenceModule');
                if (typeof module.PersistenceModule.fromApplication === 'function') {
                    const app = (globalThis as any).__gameApp;
                    if (app) return module.PersistenceModule.fromApplication(app);
                }
                return new module.PersistenceModule();
            }
        };
    }

    private loadStubModules(): void {
        this.worldModule = {
            start: async () => { },
            stop: async () => { },
            getHubState: () => null,
            getStaticContent: () => []
        };

        this.playerModule = {
            start: async () => { },
            stop: async () => { },
            getPlayerState: () => null
        };

        this.combatModule = {
            start: async () => { },
            stop: async () => { },
            getCombatState: () => null,
            generateMobPreview: () => null
        };

        this.persistenceModule = {
            start: async () => { },
            stop: async () => { },
            save: () => this.emit('saveGameRequested', {}),
            load: () => this.emit('loadGameRequested', {})
        };
    }

    private setupEventForwarding(): void {
        this.emitter.setMaxListeners(50);

        const forwardableEvents = [
            'playerStateModified',
            'playerLocationChanged',
            'partyUpdated',
            'combatStarted',
            'combatEnded',
            'gameLoaded',
            'notification'
        ];

        forwardableEvents.forEach(eventName => {
            this.emitter.on(`internal_${eventName}`, (payload) => {
                this.emit(eventName, payload);
            });
        });
    }
}

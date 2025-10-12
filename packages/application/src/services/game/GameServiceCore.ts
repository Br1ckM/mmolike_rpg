import { EventEmitter } from '../../utils/EventEmitter';
import { DomainModuleLoader } from './ModuleLoader';
import type { IGameService } from '../../types/IGameService';

// ECS imports for proper world initialization
import ECS, { Entity } from 'ecs-lib';

export class GameServiceCore implements IGameService {
    protected emitter = new EventEmitter();
    protected isInitialized = false;

    protected worldModule?: any;
    protected playerModule?: any;
    protected combatModule?: any;
    protected persistenceModule?: any;

    // ECS world and game state
    public world?: ECS;
    public player?: Entity;
    public content?: any;
    public contentIdToEntityIdMap?: Map<string, number>;
    public playerName?: string;
    public playerOptions?: any;

    constructor() {
        this.setupEventForwarding();
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;
        try {
            await this.initializeModules();

            // Initialize ECS world
            this.initializeECSWorld();

            this.isInitialized = true;
            this.emit('gameServiceInitialized', {});
        } catch (error) {
            console.error('[GameServiceCore] Initialization failed:', error);
            throw error;
        }
    }

    private initializeECSWorld(): void {
        try {
            // Initialize the ECS world
            this.world = new ECS();
            this.contentIdToEntityIdMap = new Map<string, number>();

            // Get content from ContentProvider
            const gameApp = (globalThis as any).__gameApp;
            if (gameApp && gameApp._contentProvider) {
                // Get all available content
                this.content = {
                    ancestries: gameApp._contentProvider.getContent('ancestries') || new Map(),
                    mobs: gameApp._contentProvider.getContent('mobs') || new Map(),
                    items: gameApp._contentProvider.getContent('items') || new Map(),
                    skills: gameApp._contentProvider.getContent('skills') || new Map(),
                    locations: gameApp._contentProvider.getContent('locations') || new Map(),
                    nodes: gameApp._contentProvider.getContent('nodes') || new Map(),
                    quests: gameApp._contentProvider.getContent('quests') || new Map(),
                    effects: gameApp._contentProvider.getContent('effects') || new Map(),
                    config: gameApp._contentProvider.getContent('config') || {}
                };

                console.log('[GameServiceCore] ECS world initialized with content:', Object.keys(this.content));
            } else {
                console.warn('[GameServiceCore] No content provider available, initializing with empty content');
                this.content = {
                    ancestries: new Map(),
                    mobs: new Map(),
                    items: new Map(),
                    skills: new Map(),
                    locations: new Map(),
                    nodes: new Map(),
                    quests: new Map(),
                    effects: new Map(),
                    config: {}
                };
            }

            // Listen for character creation events to create the player entity
            this.subscribe('characterCreationRequested', this.handleCharacterCreation.bind(this));

        } catch (error) {
            console.error('[GameServiceCore] Failed to initialize ECS world:', error);
        }
    }

    private handleCharacterCreation(options: any): void {
        console.log('[DEBUG - GameServiceCore] ==> handleCharacterCreation called with options:', options);

        try {
            if (this.player) {
                console.log('[DEBUG - GameServiceCore] ❌ Player already exists, ignoring character creation. Current player ID:', this.player.id);
                return;
            }

            console.log('[DEBUG - GameServiceCore] ✓ No existing player, proceeding with creation');
            console.log('[DEBUG - GameServiceCore] World available:', !!this.world);
            console.log('[DEBUG - GameServiceCore] Content available:', !!this.content);

            // Import character creation components
            console.log('[DEBUG - GameServiceCore] ==> Loading Character entity class');
            const { Character } = require('mmolike_rpg-domain/ecs/entities/character');
            const { ControllableComponent } = require('mmolike_rpg-domain/ecs/components/character');
            console.log('[DEBUG - GameServiceCore] ✓ Character classes loaded successfully');

            // Get player template from content
            console.log('[DEBUG - GameServiceCore] ==> Looking for PLAYER_TEMPLATE in content.mobs');
            console.log('[DEBUG - GameServiceCore] Available mob keys:', this.content?.mobs ? Array.from(this.content.mobs.keys()) : 'No mobs available');

            const playerTemplate = this.content?.mobs?.get('PLAYER_TEMPLATE');
            if (!playerTemplate) {
                console.error('[DEBUG - GameServiceCore] ❌ Player template not found in content');
                console.log('[DEBUG - GameServiceCore] Content mobs size:', this.content?.mobs?.size || 0);
                return;
            }
            console.log('[DEBUG - GameServiceCore] ✓ Player template found:', playerTemplate);

            // Create player data from template
            console.log('[DEBUG - GameServiceCore] ==> Creating player data from template');
            const playerData = JSON.parse(JSON.stringify(playerTemplate.components));
            console.log('[DEBUG - GameServiceCore] Template player data:', playerData);

            if (playerData.info) {
                playerData.info.name = options.name;
                playerData.info.pronouns = options.pronouns;
                playerData.info.ancestryId = options.ancestryId;
                console.log('[DEBUG - GameServiceCore] ✓ Player info updated:', playerData.info);
            } else {
                console.warn('[DEBUG - GameServiceCore] ⚠️ No info component in player template');
            }

            // Create the player entity
            console.log('[DEBUG - GameServiceCore] ==> Creating Character entity');
            this.player = new Character(playerData);
            console.log('[DEBUG - GameServiceCore] ✓ Character entity created:', this.player);

            if (this.world && this.player) {
                console.log('[DEBUG - GameServiceCore] ==> Adding player to world');
                this.world.addEntity(this.player);
                console.log('[DEBUG - GameServiceCore] ✓ Player entity added to world with ID:', this.player.id);

                // Emit player state change event
                console.log('[DEBUG - GameServiceCore] ==> Emitting playerStateModified event');
                const eventData = { characterId: this.player.id };
                this.emit('playerStateModified', eventData);
                console.log('[DEBUG - GameServiceCore] ✓ playerStateModified event emitted with data:', eventData);
            } else {
                console.error('[DEBUG - GameServiceCore] ❌ Cannot add player to world - world or player is null');
                console.log('[DEBUG - GameServiceCore] World exists:', !!this.world);
                console.log('[DEBUG - GameServiceCore] Player exists:', !!this.player);
            }

        } catch (error) {
            console.error('[DEBUG - GameServiceCore] ❌ Failed to create player character:', error);
            console.error('[DEBUG - GameServiceCore] Error stack:', error instanceof Error ? error.stack : 'No stack available');
        }
    }

    async start(): Promise<void> {
        if (!this.isInitialized) await this.init();
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
        this.emit('dialogueResponseSelected', { index });
    }

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

    getStaticContent(key: string): any[] {
        if (this.worldModule?.getStaticContent) return this.worldModule.getStaticContent(key);
        return [];
    }

    generateMobPreview(protoId: string, level: number): any | null {
        if (this.combatModule?.generateMobPreview) return this.combatModule.generateMobPreview(protoId, level);
        return null;
    }

    dealDamageToPlayer(characterId: string, amount: number): void {
        this.emit('dev_dealDamageToPlayer', { characterId, amount });
    }

    // --- Module initialization ---
    protected async initializeModules(): Promise<void> {
        try {
            const domainLoader = new DomainModuleLoader();
            this.worldModule = await domainLoader.loadWorldModule();
            this.playerModule = await domainLoader.loadPlayerModule();
            this.combatModule = await domainLoader.loadCombatModule();
            this.persistenceModule = await domainLoader.loadPersistenceModule();
            console.log('[GameServiceCore] Domain modules loaded successfully');
        } catch (error) {
            console.warn('[GameServiceCore] Domain modules unavailable, using stubs:', error);
            this.loadStubModules();
        }
    }

    protected loadStubModules(): void {
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

    protected setupEventForwarding(): void {
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
            this.emitter.on(`internal_${eventName}`, (payload: any) => {
                this.emit(eventName, payload);
            });
        });
    }
}

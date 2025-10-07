import { GameService } from './GameService';
import { CommandService } from './CommandService';
import { QueryService } from './QueryService';
import { GameLoop } from './GameLoop';
import { ContentService, type RawGameContent } from '../../domain/src/ContentService';

// Import the parsed YAML content directly
import affixes from '../../content/src/affixes.yaml';
import dialogueTrees from '../../content/src/dialogue.yaml';
import effects from '../../content/src/effects.yaml';
import jobs from '../../content/src/jobs.yaml';
import quests from '../../content/src/quests.yaml';
import skills from '../../content/src/skills.yaml';
import traits from '../../content/src/traits.yaml';
import playerTemplate from '../../content/src/characters/player-template.yaml';
import baseItems from '../../content/src/items/base-items.yaml';
import collectibles from '../../content/src/items/collectibles.yaml';
import consumables from '../../content/src/items/consumables.yaml';
import inventories from '../../content/src/items/inventories.yaml';
import misc from '../../content/src/items/misc.yaml';
import mods from '../../content/src/items/mods.yaml';
import questItems from '../../content/src/items/quest-items.yaml';
import reagants from '../../content/src/items/reagants.yaml';
import npcs from '../../content/src/characters/npcs.yaml';
import locations from '../../content/src/locations.yaml';
import nodes from '../../content/src/nodes.yaml';
import lootTables from '../../content/src/loot_table.yaml'
import encounters from '../../content/src/encounters.yaml'
import mobs from '../../content/src/characters/mobs.yaml';
import families from '../../content/src/families.yaml';
import tiers from '../../content/src/tiers.yaml';
import archetypes from '../../content/src/archetypes.yaml';
import spawnPools from '../../content/src/spawn_pools.yaml';
import config from '../../content/src/config.yaml';


class Application {
    public game!: GameService;
    public commands!: CommandService;
    public queries!: QueryService;
    private loop!: GameLoop;
    public isReady: Promise<void>;
    constructor() {
        this.isReady = this.initialize();
    }

    private async initialize(): Promise<void> {
        console.log('[LOAD DIAGNOSTIC] Application initialize started.');

        const combinedBaseItemsArray = [
            ...baseItems,
            ...collectibles,
            ...consumables,
            ...inventories,
            ...misc,
            ...mods,
            ...questItems,
            ...reagants
        ];

        const allContent: RawGameContent = {
            affixes,
            dialogueTrees,
            effects,
            jobs,
            quests,
            skills,
            traits,
            lootTables,
            locations,
            nodes,
            encounters,
            families,
            tiers,
            archetypes,
            spawnPools,
            config,
            baseItems: combinedBaseItemsArray,
            mobs: [playerTemplate, ...npcs, ...mobs]
        };

        const contentService = new ContentService(allContent as unknown as RawGameContent);

        this.game = new GameService(contentService);
        this.commands = new CommandService(this.game.eventBus);
        this.queries = new QueryService(this.game, this.game.eventBus);
        this.loop = new GameLoop(this.game);

        // --- START FIX ---
        // Listen for filter updates and immediately trigger a player state refresh.
        this.game.eventBus.on('updateContentFilter', (settings) => {
            console.log('[Application] Received filter update:', settings);
            this.game.settings.showNsfwContent = settings.showNsfwContent;
            this.game.settings.showVoreContent = settings.showVoreContent;

            // If the player exists, emit an event to force the QueryService to re-publish the player state
            // with the newly applied filters.
            if (this.game.player) {
                this.game.eventBus.emit('playerStateModified', { characterId: this.game.player.id });
            }
        });
        // --- END FIX ---

        this.game.startGame();
        this.loop.start();

        console.log('[LOAD DIAGNOSTIC] Application initialization finished.');
    }
}

export const App = new Application();


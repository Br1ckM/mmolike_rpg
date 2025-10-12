// Auto-aggregated content index for the content package.
// Import the YAML files so bundlers (Vite + yaml plugin) include them and expose parsed data.
import ancestries from './ancestries.yaml';
import effects from './effects.yaml';
import skills from './skills.yaml';
import config from './config.yaml';
import traits from './traits.yaml';
import dens from './dens.yaml';
import affixes from './affixes.yaml';
import mobs from './mobs.yaml';
import nodes from './nodes.yaml';
import player_progression from './player_progression.yaml';
import dialogue from './dialogue.yaml';
import achievements from './achievements.yaml';
import zones from './zones.yaml';
import baseItems from './items/base-items.yaml';
import collectibles from './items/collectibles.yaml';
import consumables from './items/consumables.yaml';
import questItems from './items/quest-items.yaml';
import mods from './items/mods.yaml';
import reagants from './items/reagants.yaml';
import miscItems from './items/misc.yaml';
import inventories from './items/inventories.yaml';
import archetypes from './archetypes.yaml';
import jobs from './jobs.yaml';
import exploration_events from './exploration_events.yaml';
import loot_table from './loot_table.yaml';
import tiers from './tiers.yaml';
import quests from './quests.yaml';
import items from './items.yaml';
import spawn_pools from './spawn_pools.yaml';
import encounters from './encounters.yaml';
import locations from './locations.yaml';
import player from './player.yaml';
import families from './families.yaml';
import characters_player_template from './characters/player-template.yaml';
import characters_npcs from './characters/npcs.yaml';
import characters_mobs from './characters/mobs.yaml';

// Build a map of keys -> content so consumers can access by getStaticContent('ancestries')
const allContent: { [key: string]: any } = {
    ancestries,
    effects,
    skills,
    config,
    traits,
    dens,
    affixes,
    mobs,
    nodes,
    player_progression,
    dialogue,
    achievements,
    zones,
    'items/base-items': baseItems,
    'items/collectibles': collectibles,
    'items/consumables': consumables,
    'items/quest-items': questItems,
    'items/mods': mods,
    'items/reagants': reagants,
    'items/misc': miscItems,
    'items/inventories': inventories,
    archetypes,
    jobs,
    exploration_events,
    loot_table,
    tiers,
    quests,
    items,
    spawn_pools,
    encounters,
    locations,
    player,
    families,
    'characters/player-template': characters_player_template,
    'characters/npcs': characters_npcs,
    'characters/mobs': characters_mobs,
};

export default allContent;

// Also export named properties for convenience
export {
    ancestries,
    effects,
    skills,
    config,
    traits,
    dens,
    affixes,
    mobs,
    nodes,
    player_progression,
    dialogue,
    achievements,
    zones,
    baseItems,
    collectibles,
    consumables,
    questItems,
    mods,
    reagants,
    miscItems as items_misc,
    inventories,
    archetypes,
    jobs,
    exploration_events,
    loot_table,
    tiers,
    quests,
    items,
    spawn_pools,
    encounters,
    locations,
    player,
    families,
    characters_player_template as player_template,
    characters_npcs as characters_npcs,
    characters_mobs as characters_mobs,
};

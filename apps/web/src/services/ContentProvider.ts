// ContentProvider - Handles loading and providing game content to the application layer
// @ts-ignore - Using Vite alias defined in vite.config.ts
import allContent from 'mmolike_rpg-content';

/**
 * ContentProvider manages game content loading for the web application.
 * It imports content statically (so Vite can process YAML files) and provides
 * methods for the application layer to access it.
 */
export class ContentProvider {
    private static content = allContent;

    /**
     * Get content by key, handling the various naming conventions
     */
    static getContent(key: string): any[] {
        const content = this.content;

        // Direct key match
        if (content[key]) {
            return Array.isArray(content[key]) ? content[key] : [content[key]];
        }

        // Handle nested keys like "items/base-items" 
        if (key.includes('/')) {
            const nestedKey = key.replace('/', '_').replace('-', '_');
            if (content[nestedKey]) {
                return Array.isArray(content[nestedKey]) ? content[nestedKey] : [content[nestedKey]];
            }
        }

        // Try with the key as exported in the content index
        const exportedKeys: Record<string, string> = {
            'items/base-items': 'baseItems',
            'items/collectibles': 'collectibles',
            'items/consumables': 'consumables',
            'items/quest-items': 'questItems',
            'items/mods': 'mods',
            'items/reagants': 'reagants',
            'items/misc': 'items_misc',
            'items/inventories': 'inventories',
            'characters/player-template': 'player_template',
            'characters/npcs': 'characters_npcs',
            'characters/mobs': 'characters_mobs'
        };

        const exportKey = exportedKeys[key];
        if (exportKey && content[exportKey]) {
            return Array.isArray(content[exportKey]) ? content[exportKey] : [content[exportKey]];
        }

        console.warn(`[ContentProvider] No content found for key: ${key}`);
        return [];
    }

    /**
     * Get all available content keys
     */
    static getContentKeys(): string[] {
        return Object.keys(this.content);
    }

    /**
     * Initialize content provider and attach to global game app
     */
    static initialize(gameApp: any): void {
        // Attach content provider to the game app so application services can access it
        gameApp._contentProvider = this;
        console.log('[ContentProvider] Initialized with content keys:', this.getContentKeys());
    }
}
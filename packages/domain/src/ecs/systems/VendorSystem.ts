import ECS from 'ecs-lib';
import { Entity, Component } from 'ecs-lib';
import { EventBus } from '../EventBus';
import { VendorComponent } from '../components/npc';
import { InventoryComponent, ProgressionComponent } from '../components/character';
import { CurrencyComponent, type CurrencyData, SlotsComponent, VendorValueComponent, ItemInfoComponent } from '../components/item';

/**
 * Manages all buy and sell transactions between a player and an NPC vendor.
 */
export class VendorSystem {
    private world: ECS;
    private eventBus: EventBus;

    // State for the currently active vendor session
    private activeVendorSession: {
        characterId: number;
        npcId: number;
    } | null = null;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        // Listen for events from the Application Layer/DialogueSystem
        this.eventBus.on('vendorScreenOpened', this.onVendorScreenOpened.bind(this));
        this.eventBus.on('buyItemRequested', this.handleBuyItem.bind(this));
        this.eventBus.on('sellItemRequested', this.handleSellItem.bind(this));
    }

    private onVendorScreenOpened(payload: { characterId: number; npcId: number; }): void {
        this.activeVendorSession = payload;
        const character = this.world.getEntity(payload.characterId);
        const npc = this.world.getEntity(payload.npcId);
        if (!character || !npc) return;

        // For now, vendor inventory is static. This could be expanded.
        const vendorItems = [
            { id: 1001, name: 'Minor Health Potion', cost: 10, icon: 'pi-plus-circle' },
            { id: 1002, name: 'Basic Sword', cost: 50, icon: 'pi-bolt' },
            { id: 1003, name: 'Leather Cap', cost: 35, icon: 'pi-user' }
        ];

        // Find items in the player's inventory that have a vendor value.
        const playerSellableItems: any[] = [];
        const inventory = InventoryComponent.oneFrom(character)?.data;
        if (inventory) {
            inventory.bagIds.forEach(bagId => {
                const bagEntity = this.world.getEntity(parseInt(bagId, 10));
                const slots = SlotsComponent.oneFrom(bagEntity!)?.data;
                if (slots) {
                    slots.items.forEach(itemId => {
                        if (itemId) {
                            const itemEntity = this.world.getEntity(parseInt(itemId, 10));
                            if (itemEntity && VendorValueComponent.oneFrom(itemEntity)) {
                                playerSellableItems.push({
                                    id: itemEntity.id,
                                    name: ItemInfoComponent.oneFrom(itemEntity)!.data.name,
                                    value: Math.floor(VendorValueComponent.oneFrom(itemEntity)!.data.gold * 0.5)
                                });
                            }
                        }
                    });
                }
            });
        }

        this.eventBus.emit('vendorInventoryUpdated', { vendorItems, playerSellableItems });
    }

    private handleBuyItem(payload: { characterId: number; npcId: number; itemEntityId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        const itemToBuy = this.world.getEntity(payload.itemEntityId);
        if (!character || !itemToBuy) return;

        const itemValueComp = VendorValueComponent.oneFrom(itemToBuy)?.data;
        const price = itemValueComp?.gold || 0; // For now, price is just its base value

        const playerWallet = this.getPlayerWallet(character);
        if (!playerWallet || playerWallet.data.gold < price) {
            console.log("Not enough gold to buy this item.");
            // You could emit a "notEnoughGold" event to the UI here.
            return;
        }

        const playerLevel = ProgressionComponent.oneFrom(character)?.data.level || 1;

        // Deduct gold
        playerWallet.data.gold -= price;

        // Emit event to have the InventorySystem move the item to the player's bags.
        // NOTE: This is a simplified model. A real vendor would have its own inventory.
        // For now, we'll just generate a new item for the player.
        this.eventBus.emit('generateItemRequest', {
            baseItemId: itemToBuy.id.toString(), // Assuming the entityId is the baseId
            characterId: character.id,
            itemLevel: playerLevel,
        });

        console.log(`Character ${character.id} bought item ${itemToBuy.id} for ${price} gold.`);
    }

    private handleSellItem(payload: { characterId: number; npcId: number; itemEntityId: number; }): void {
        const character = this.world.getEntity(payload.characterId);
        const itemToSell = this.world.getEntity(payload.itemEntityId);
        if (!character || !itemToSell) return;

        const itemValueComp = VendorValueComponent.oneFrom(itemToSell)?.data;
        if (!itemValueComp) {
            console.log("This item cannot be sold.");
            return;
        }

        const salePrice = Math.floor(itemValueComp.gold * 0.5); // Sell for 50% of base value

        const playerWallet = this.getPlayerWallet(character);
        if (playerWallet) {
            playerWallet.data.gold += salePrice;
        }

        // The item is removed from inventory and destroyed
        this.eventBus.emit('removeItemFromInventory', {
            characterId: character.id,
            itemEntityId: itemToSell.id,
            reason: 'drop' // Using 'drop' as it destroys the entity
        });

        console.log(`Character ${character.id} sold item ${itemToSell.id} for ${salePrice} gold.`);
    }

    private getPlayerWallet(character: Entity): Component<CurrencyData> | null {
        const inventory = InventoryComponent.oneFrom(character)?.data;
        if (!inventory?.walletId) return null;

        const walletEntity = this.world.getEntity(parseInt(inventory.walletId, 10));
        return walletEntity ? CurrencyComponent.oneFrom(walletEntity) : null;
    }
}
import { Component } from 'ecs-lib';
import type { EquipmentSlot } from './character'; // Assuming EquipmentSlot is exported from character components
// Assuming EquipmentSlot is exported from character components

// --- TYPE DEFINITIONS ---

export type ItemType = 'equipment' | 'consumable' | 'reagent' | 'quest' | 'collectible' | 'junk' | 'misc';
export type ItemRarity = 'Common' | 'Uncommon' | 'Rare' | 'Unique' | 'Quest' | 'Junk';

export interface ItemInfoData {
    name: string;
    description: string;
    itemType: ItemType;
    rarity: ItemRarity;
    // Note: We reference the icon by a string name here. The UI layer will map this name to an actual icon component.
    iconName?: string;
}

export interface StackableData {
    maxStack: number;
    current: number;
}

export interface EquipableData {
    slot: EquipmentSlot;
    baseStats: { [key: string]: number }; // e.g., { "attack": 5, "defense": 10 }
}

export interface AffixData {
    id: string;
    name: string;
    type: 'prefix' | 'suffix';
    description: string;
}

export interface ModsData {
    modIds: string[]; // An array of Mod Entity IDs
}

export interface ModSlotsData {
    count: number;
}

export interface ConsumableData {
    effect: string; // e.g., "RESTORE_HEALTH", "INCREASE_STRENGTH"
    amount: number;
    duration?: number; // Optional, for effects over time
}

export interface QuestItemData {
    questId: string;
}

/** Data for items that can be turned in for faction reputation. */
export interface ReputationData {
    factionId: string;
    value: number;
}

/** Data for items that can be sold to a vendor for currency. */
export interface VendorValueData {
    gold: number;
}

// --- CONTAINER TYPE DEFINITIONS ---

export interface SlotsData {
    size: number;
    items: (string | null)[]; // Array of Item Entity IDs
}

export interface CurrencyData {
    gold: number;
}

// --- COMPONENT REGISTRATIONS ---

export const ItemInfoComponent = Component.register<ItemInfoData>();
export const StackableComponent = Component.register<StackableData>();
export const EquipableComponent = Component.register<EquipableData>();
export const AffixesComponent = Component.register<AffixData[]>(); // Note: The component holds an array of affixes
export const ModsComponent = Component.register<ModsData>();
export const ModSlotsComponent = Component.register<ModSlotsData>();
export const ConsumableComponent = Component.register<ConsumableData>();
export const SlotsComponent = Component.register<SlotsData>();
export const CurrencyComponent = Component.register<CurrencyData>();
export const QuestItemComponent = Component.register<QuestItemData>();
export const ReputationComponent = Component.register<ReputationData>();
export const VendorValueComponent = Component.register<VendorValueData>();
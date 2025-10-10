import { Entity } from 'ecs-lib';
import {
    ItemInfoComponent, type ItemInfoData,
    StackableComponent, type StackableData,
    EquipableComponent, type EquipableData,
    AffixesComponent, type AffixData,
    ModsComponent, type ModsData,
    ModSlotsComponent, type ModSlotsData,
    ConsumableComponent, type ConsumableData,
    QuestItemComponent, type QuestItemData,
    ReputationComponent, type ReputationData,
    VendorValueComponent, type VendorValueData,
    SlotsComponent, type SlotsData,
    CurrencyComponent, type CurrencyData
} from '../components/item';

// Blueprint for raw item data from YAML
export interface ItemData {
    info: ItemInfoData;
    stackable?: StackableData;
    equipable?: EquipableData;
    affixes?: AffixData[];
    mods?: ModsData;
    modSlots?: ModSlotsData;
    consumable?: ConsumableData;
    questItem?: QuestItemData;
    reputation?: ReputationData;
    vendorValue?: VendorValueData;
    slots?: SlotsData;
    currency?: CurrencyData;
}

export class Item extends Entity {
    constructor(data: ItemData) {
        super();
        this.add(new ItemInfoComponent(data.info));
        if (data.stackable) this.add(new StackableComponent(data.stackable));
        if (data.equipable) this.add(new EquipableComponent(data.equipable));
        if (data.affixes) this.add(new AffixesComponent(data.affixes));
        if (data.mods) this.add(new ModsComponent(data.mods));
        if (data.modSlots) this.add(new ModSlotsComponent(data.modSlots));
        if (data.consumable) this.add(new ConsumableComponent(data.consumable));
        if (data.questItem) this.add(new QuestItemComponent(data.questItem));
        if (data.reputation) this.add(new ReputationComponent(data.reputation));
        if (data.vendorValue) this.add(new VendorValueComponent(data.vendorValue));
        if (data.slots) this.add(new SlotsComponent(data.slots));
        if (data.currency) this.add(new CurrencyComponent(data.currency));
    }
}
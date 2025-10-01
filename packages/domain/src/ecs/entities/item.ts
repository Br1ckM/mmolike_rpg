import { Entity } from 'ecs-lib';
import {
    ItemInfoComponent, InfoData,
    StackableComponent, StackableData,
    EquipableComponent, EquipableData,
    AffixesComponent, AffixData,
    ModsComponent, ModsData,
    ModSlotsComponent, ModSlotsData,
    ConsumableComponent, ConsumableData,
    QuestItemComponent, QuestItemData,
    ReputationComponent, ReputationData,
    VendorValueComponent, VendorValueData
} from '../components/item';

// Blueprint for raw item data from YAML
export interface ItemData {
    info: InfoData;
    stackable?: StackableData;
    equipable?: EquipableData;
    affixes?: AffixData[];
    mods?: ModsData;
    modSlots?: ModSlotsData;
    consumable?: ConsumableData;
    questItem?: QuestItemData;
    reputation?: ReputationData;
    vendorValue?: VendorValueData;
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
    }
}
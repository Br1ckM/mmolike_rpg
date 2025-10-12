import getEntityDTO from '../../utils/getEntityDTO';
import type { PlayerState, HubState, CombatState } from '../../types/game';
import { GameServiceCore } from './GameServiceCore';

export class GameServiceState extends GameServiceCore {
    getPlayerState(playerId?: string): PlayerState | null {
        if (this.playerModule?.getPlayerState) {
            try {
                return this.playerModule.getPlayerState(playerId);
            } catch (error) {
                console.error('[GameServiceState] Player module failed:', error);
            }
        }

        try {
            const testModules = (this as any)._testModules;
            const charComps = testModules?.character ?? require('mmolike_rpg-domain/ecs/components/character');
            const itemComps = testModules?.item ?? require('mmolike_rpg-domain/ecs/components/item');
            const questComps = testModules?.quest ?? require('mmolike_rpg-domain/ecs/components/quest');
            const skillComps = testModules?.skill ?? require('mmolike_rpg-domain/ecs/components/skill');

            const numericPlayerId = playerId != null ? (parseInt(playerId as any, 10) || undefined) : undefined;

            const world = (this as any).world;
            let playerEntity = (this as any).player;
            if (!world || !playerEntity) {
                if (numericPlayerId != null && world && typeof world.getEntity === 'function') {
                    playerEntity = world.getEntity(numericPlayerId as any);
                }
            }
            if (!playerEntity) return null;

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

            const allEntities = (world as any).entities as any[] || [];
            const companions = allEntities
                .filter(e => {
                    const comp = charComps.CompanionComponent.oneFrom(e)?.data;
                    return comp && comp.recruited;
                })
                .map(e => getEntityDTO(e, components as any));
            playerDTO.companions = companions;

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

            const questStatusComponents = (questComps.QuestStatusComponent ? questComps.QuestStatusComponent.allFrom(playerEntity) : []);
            playerDTO.quests = (questStatusComponents || []).map((statusComponent: any) => {
                const questEntityId = (this as any).contentIdToEntityIdMap?.get(statusComponent.data.questId);
                if (!questEntityId) return null;
                const questEntity = world.getEntity(questEntityId);
                if (!questEntity) return null;
                return {
                    ...statusComponent.data,
                    info: questComps.QuestComponent.oneFrom(questEntity)?.data,
                    objectives: questComps.QuestObjectiveComponent.oneFrom(questEntity)?.data,
                };
            }).filter((q: any) => q !== null);

            const skillBookComponent = playerDTO.SkillBookComponent;
            if (skillBookComponent) {
                const hydratedSkills = (skillBookComponent.knownSkills || []).map((skillId: string) => {
                    const numericSkillId = (this as any).contentIdToEntityIdMap?.get(skillId);
                    const skillEntity = numericSkillId ? world.getEntity(numericSkillId) : undefined;
                    if (!skillEntity) return null;
                    const info = skillComps.SkillInfoComponent.oneFrom(skillEntity)?.data;
                    const skill = skillComps.SkillComponent.oneFrom(skillEntity)?.data;
                    const progression = skillComps.ProgressionComponent.oneFrom(skillEntity)?.data;
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

            if (playerDTO.AppearanceComponent && (this as any).settings) {
                playerDTO.AppearanceComponent.attributes = (playerDTO.AppearanceComponent.attributes || []).filter(
                    (attr: any) => {
                        if (attr.isExtreme) return (this as any).settings.showNsfwContent && (this as any).settings.showVoreContent;
                        if (attr.isSensitive) return (this as any).settings.showNsfwContent;
                        return true;
                    }
                );
            }

            const equipmentComp = charComps.EquipmentComponent ? charComps.EquipmentComponent.oneFrom(playerEntity) : null;
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
            return null;
        }
    }

    getHubState(playerId?: string): HubState | null {
        if (this.worldModule?.getHubState) {
            try {
                return this.worldModule.getHubState(playerId);
            } catch (error) {
                console.error('[GameServiceState] World module failed:', error);
            }
        }

        try {
            const testModules = (this as any)._testModules;
            const worldComps = testModules?.world ?? require('mmolike_rpg-domain/ecs/components/world');
            const npcComps = testModules?.npc ?? require('mmolike_rpg-domain/ecs/components/npc');

            const PlayerLocationComponent = worldComps.PlayerLocationComponent;
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

    getCombatState(combatId?: string): CombatState | null {
        if (this.combatModule?.getCombatState) {
            try {
                return this.combatModule.getCombatState(combatId);
            } catch (error) {
                console.error('[GameServiceState] Combat module failed:', error);
            }
        }

        try {
            const testModules = (this as any)._testModules;
            const charComps = testModules?.character ?? require('mmolike_rpg-domain/ecs/components/character');
            const combatComps = testModules?.combat ?? require('mmolike_rpg-domain/ecs/components/combat');
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
}

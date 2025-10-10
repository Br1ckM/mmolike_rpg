import { Component } from 'ecs-lib';

export interface DenRunData {
    denId: string; // ID from dens.yaml
    denName: string;
    characterId: number;
    currentStage: number; // 0-indexed
    totalStages: number;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export const DenRunComponent = Component.register<DenRunData>();
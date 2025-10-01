import ECS from 'ecs-lib';
import { Entity } from 'ecs-lib';
import { EventBus } from '../EventBus';
import { TrainerComponent } from '../components/npc';
import { SkillBookComponent, JobsComponent } from '../components/character';

/**
 * Manages the process of a character learning new skills or unlocking new jobs from trainer NPCs.
 */
export class TrainerSystem {
    private world: ECS;
    private eventBus: EventBus;

    constructor(world: ECS, eventBus: EventBus) {
        this.world = world;
        this.eventBus = eventBus;

        // Listen for events from the Application Layer
        this.eventBus.on('learnSkillRequested', this.handleLearnSkill.bind(this));
        this.eventBus.on('unlockJobRequested', this.handleUnlockJob.bind(this));
    }

    private handleLearnSkill(payload: { characterId: number; npcId: number; skillId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        const npc = this.world.getEntity(payload.npcId);
        if (!character || !npc) return;

        const trainer = TrainerComponent.oneFrom(npc)?.data;
        const skillBook = SkillBookComponent.oneFrom(character)?.data;

        // --- Validation ---
        // 1. Does the NPC actually teach this skill?
        if (!trainer?.trainableSkillIds?.includes(payload.skillId)) {
            console.error(`NPC ${npc.id} does not teach skill ${payload.skillId}.`);
            return;
        }
        // 2. Does the character already know this skill?
        if (skillBook?.knownSkills.includes(payload.skillId)) {
            console.log(`Character ${character.id} already knows skill ${payload.skillId}.`);
            return;
        }
        // 3. (Future) Does the character have enough currency to learn?

        // --- Execution ---
        if (skillBook) {
            skillBook.knownSkills.push(payload.skillId);
            console.log(`Character ${character.id} learned skill ${payload.skillId}.`);
            this.eventBus.emit('skillLearned', {
                characterId: character.id,
                skillId: payload.skillId,
                success: true
            });
        }
    }

    private handleUnlockJob(payload: { characterId: number; npcId: number; jobId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        const npc = this.world.getEntity(payload.npcId);
        if (!character || !npc) return;

        const trainer = TrainerComponent.oneFrom(npc)?.data;
        const jobs = JobsComponent.oneFrom(character)?.data;

        // --- Validation ---
        if (!trainer?.trainableJobIds?.includes(payload.jobId)) {
            console.error(`NPC ${npc.id} does not teach job ${payload.jobId}.`);
            return;
        }
        if (jobs?.jobList.some(job => job.id === payload.jobId)) {
            console.log(`Character ${character.id} already knows job ${payload.jobId}.`);
            return;
        }

        // --- Execution ---
        if (jobs) {
            // In a real game, you would fetch the base job data from your content files
            // before adding it to the character's list.
            const newJob = {
                id: payload.jobId,
                name: 'New Job', // Placeholder
                level: 1,
                xp: 0,
                skills: []
            };
            jobs.jobList.push(newJob);
            console.log(`Character ${character.id} unlocked job ${payload.jobId}.`);
        }
    }
}
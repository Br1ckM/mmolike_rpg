import ECS from 'ecs-lib';
import { EventBus } from '../EventBus';
import { TrainerComponent } from '../components/npc';
import { SkillBookComponent, JobsComponent } from '../components/character';
import { GameSystem } from './GameSystem'; // Import the new base class

/**
 * Manages the process of a character learning new skills or unlocking new jobs from trainer NPCs.
 */
export class TrainerSystem extends GameSystem { // Extend GameSystem

    constructor(world: ECS, eventBus: EventBus) {
        // This system is event-driven.
        super(world, eventBus, []);

        // Use the inherited 'subscribe' method
        this.subscribe('trainingScreenOpened', this.onTrainingScreenOpened.bind(this));
        this.subscribe('learnSkillRequested', this.handleLearnSkill.bind(this));
        this.subscribe('unlockJobRequested', this.handleUnlockJob.bind(this));
    }

    private onTrainingScreenOpened(payload: { characterId: number; npcId: number }): void {
        // This is a placeholder. In a real system, you would:
        // 1. Get the NPC's TrainerComponent to see what they teach.
        // 2. Get the Player's SkillBookComponent to see what they know.
        // 3. Filter the list to only show learnable skills.
        // 4. Get skill costs from the skill definitions.
        const availableSkills = [
            { id: 'skill_power_strike', name: 'Power Strike', cost: 100, description: 'A powerful overhead swing.' },
            { id: 'skill_fortify', name: 'Fortify', cost: 250, description: 'Temporarily increases defense.' },
        ];

        // This event does not exist yet, we'll add it in the next step.
        // For now, let's log it to show the data is ready.
        console.log("Trainer data ready to be emitted:", { availableSkills });
    }

    private handleLearnSkill(payload: { characterId: number; npcId: number; skillId: string; }): void {
        const character = this.world.getEntity(payload.characterId);
        const npc = this.world.getEntity(payload.npcId);
        if (!character || !npc) return;

        const trainer = TrainerComponent.oneFrom(npc)?.data;
        const skillBook = SkillBookComponent.oneFrom(character)?.data;

        if (!trainer?.trainableSkillIds?.includes(payload.skillId)) {
            console.error(`NPC ${npc.id} does not teach skill ${payload.skillId}.`);
            return;
        }
        if (skillBook?.knownSkills.includes(payload.skillId)) {
            console.log(`Character ${character.id} already knows skill ${payload.skillId}.`);
            return;
        }
        // (Future) Does the character have enough currency to learn?

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

        if (!trainer?.trainableJobIds?.includes(payload.jobId)) {
            console.error(`NPC ${npc.id} does not teach job ${payload.jobId}.`);
            return;
        }
        if (jobs?.jobList.some(job => job.id === payload.jobId)) {
            console.log(`Character ${character.id} already knows job ${payload.jobId}.`);
            return;
        }

        if (jobs) {
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
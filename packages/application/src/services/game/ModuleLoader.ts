export class DomainModuleLoader {
    async loadWorldModule() {
        const module = await import('../../domains/world/WorldModule');
        if (typeof module.WorldModule.fromApplication === 'function') {
            const app = (globalThis as any).__gameApp;
            if (app) return module.WorldModule.fromApplication(app);
        }
        return new module.WorldModule();
    }

    async loadPlayerModule() {
        const module = await import('../../domains/player/PlayerModule');
        if (typeof module.PlayerModule.fromApplication === 'function') {
            const app = (globalThis as any).__gameApp;
            if (app) return module.PlayerModule.fromApplication(app);
        }
        return new module.PlayerModule();
    }

    async loadCombatModule() {
        const module = await import('../../domains/combat/CombatModule');
        if (typeof module.CombatModule.fromApplication === 'function') {
            const app = (globalThis as any).__gameApp;
            if (app) return module.CombatModule.fromApplication(app);
        }
        return new module.CombatModule();
    }

    async loadPersistenceModule() {
        const module = await import('../../domains/persistence/PersistenceModule');
        if (typeof module.PersistenceModule.fromApplication === 'function') {
            const app = (globalThis as any).__gameApp;
            if (app) return module.PersistenceModule.fromApplication(app);
        }
        return new module.PersistenceModule();
    }
}

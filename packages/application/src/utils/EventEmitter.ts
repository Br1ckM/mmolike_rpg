/**
 * Minimal browser-friendly EventEmitter replacement.
 * Implements a subset of Node's EventEmitter API used in this project:
 * - on / addListener
 * - off / removeListener
 * - emit
 * - setMaxListeners (no-op)
 */
export class EventEmitter {
    private listeners: Map<string, Set<Function>> = new Map();

    on(event: string, handler: Function) {
        const set = this.listeners.get(event) || new Set<Function>();
        set.add(handler);
        this.listeners.set(event, set);
        return this;
    }

    addListener(event: string, handler: Function) {
        return this.on(event, handler);
    }

    off(event: string, handler: Function) {
        const set = this.listeners.get(event);
        if (!set) return this;
        set.delete(handler);
        if (set.size === 0) this.listeners.delete(event);
        return this;
    }

    removeListener(event: string, handler: Function) {
        return this.off(event, handler);
    }

    emit(event: string, ...args: any[]) {
        const set = this.listeners.get(event);
        if (!set) return false;
        // copy handlers to avoid mutation during iteration
        const handlers = Array.from(set.values());
        handlers.forEach(h => {
            try { h(...args); } catch (err) { setTimeout(() => { throw err; }, 0); }
        });
        return handlers.length > 0;
    }

    setMaxListeners(_n: number) {
        // no-op in browser implementation
        return this;
    }
}

export default EventEmitter;

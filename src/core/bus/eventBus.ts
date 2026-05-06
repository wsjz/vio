// src/core/bus/eventBus.ts

import type { VioEvent } from './events';

type Handler = (payload?: unknown) => void;

class EventBus {
  private listeners: Map<VioEvent, Set<Handler>> = new Map();

  emit(event: VioEvent, payload?: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error(`[EventBus] Handler for ${event} threw:`, e);
      }
    });
  }

  subscribe(event: VioEvent, handler: Handler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  subscribeOnce(event: VioEvent, handler: Handler): void {
    const unsubscribe = this.subscribe(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
  }
}

export const eventBus = new EventBus();

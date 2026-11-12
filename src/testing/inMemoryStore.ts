import type { SessionStore } from "../core/sessionStore.js";
import { summarize, type PositionSummary } from "../core/summary.js";
import type { Session, StoredSession } from "../core/types.js";

// A SessionStore that lives in memory, so tests don't need a database
export class InMemoryStore implements SessionStore {
  private sessions: StoredSession[] = [];
  private nextId = 1;

  async add(session: Session): Promise<StoredSession> {
    const stored: StoredSession = { id: this.nextId++, ...session };
    this.sessions.push(stored);
    return stored;
  }

  async list(): Promise<StoredSession[]> {
    return [...this.sessions];
  }

  async summary(): Promise<PositionSummary[]> {
    return summarize(this.sessions);
  }

  async update(id: number, session: Session): Promise<StoredSession | null> {
    const index = this.sessions.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const updated: StoredSession = { id, ...session };
    this.sessions[index] = updated;
    return updated;
  }

  async remove(id: number): Promise<boolean> {
    const before = this.sessions.length;
    this.sessions = this.sessions.filter((s) => s.id !== id);
    return this.sessions.length < before;
  }
}

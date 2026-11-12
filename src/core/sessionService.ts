import { NotFoundError } from "./errors.js";
import type { SessionStore } from "./sessionStore.js";
import type { PositionSummary } from "./summary.js";
import type { Session, StoredSession } from "./types.js";

export class SessionService {
  private readonly store: SessionStore;

  constructor(store: SessionStore) {
    this.store = store;
  }

  add(session: Session): Promise<StoredSession> {
    return this.store.add(session);
  }

  list(): Promise<StoredSession[]> {
    return this.store.list();
  }

  summary(): Promise<PositionSummary[]> {
    return this.store.summary();
  }

  async update(id: number, session: Session): Promise<StoredSession> {
    const updated = await this.store.update(id, session);

    if (updated === null) {
      throw new NotFoundError(`Session ${id} not found`);
    }

    return updated;
  }

  async remove(id: number): Promise<void> {
    const removed = await this.store.remove(id);

    if (!removed) {
      throw new NotFoundError(`Session ${id} not found`);
    }
  }
}

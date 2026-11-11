import type { PositionSummary } from "./summary.js";
import type { Session, StoredSession } from "./types.js";

// What the CLI and API need from storage, without caring how it's done
export interface SessionStore {
  add(session: Session): Promise<StoredSession>;
  list(): Promise<StoredSession[]>;
  summary(): Promise<PositionSummary[]>;
  // Replaces every field of one session; null if the id doesn't exist
  update(id: number, session: Session): Promise<StoredSession | null>;
  // True if a row was deleted, false if the id didn't exist
  remove(id: number): Promise<boolean>;
}

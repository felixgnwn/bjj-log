import type { PositionSummary } from "./summary.js";
import type { Session, StoredSession } from "./types.js";

// What the CLI and API need from storage, without caring how it's done
export interface SessionStore {
  add(session: Session): Promise<StoredSession>;
  list(): Promise<StoredSession[]>;
  summary(): Promise<PositionSummary[]>;
}

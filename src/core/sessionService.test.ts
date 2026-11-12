import { describe, expect, it } from "vitest";
import { InMemoryStore } from "../testing/inMemoryStore.js";
import { NotFoundError } from "./errors.js";
import { SessionService } from "./sessionService.js";
import type { Session } from "./types.js";

const sample: Session = {
  date: "10 November 2026",
  position: "Closed guard",
  whatYouTried: "Hip bump sweep",
  result: "yes",
  why: "They posted on one hand",
};

function makeService(): SessionService {
  return new SessionService(new InMemoryStore());
}

describe("SessionService", () => {
  it("adds a session and gives it an id", async () => {
    const service = makeService();

    const saved = await service.add(sample);

    expect(saved).toEqual({ id: 1, ...sample });
  });

  it("lists sessions in the order they were added", async () => {
    const service = makeService();

    await service.add(sample);
    await service.add({ ...sample, position: "Triangle" });

    const list = await service.list();

    expect(list.map((s) => s.position)).toEqual(["Closed guard", "Triangle"]);
  });

  it("replaces every field when updating", async () => {
    const service = makeService();
    const saved = await service.add(sample);

    const updated = await service.update(saved.id, {
      ...sample,
      result: "partly",
      why: "Sweep worked, passing didn't",
    });

    expect(updated).toEqual({
      id: saved.id,
      ...sample,
      result: "partly",
      why: "Sweep worked, passing didn't",
    });
    expect(await service.list()).toEqual([updated]);
  });

  it("throws NotFoundError when updating a missing session", async () => {
    const service = makeService();

    await expect(service.update(999, sample)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("removes a session", async () => {
    const service = makeService();
    const saved = await service.add(sample);

    await service.remove(saved.id);

    expect(await service.list()).toEqual([]);
  });

  it("throws NotFoundError when removing a missing session", async () => {
    const service = makeService();

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("summarises sessions", async () => {
    const service = makeService();

    await service.add(sample);
    await service.add({ ...sample, result: "no" });

    expect(await service.summary()).toEqual([
      { position: "closed guard", total: 2, worked: 1 },
    ]);
  });
});

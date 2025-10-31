import { describe, expect, it } from "vitest";
import { normalizePortRequests } from "../src/ports.js";

describe("normalizePortRequests", () => {
  it("enforces default visibility and sorts", () => {
    const result = normalizePortRequests([
      { port: 8081, visibility: "org", label: "Second" },
      { port: 8080, label: "App" }
    ]);

    expect(result.ports).toEqual([
      { port: 8080, visibility: "private", label: "App" },
      { port: 8081, visibility: "org", label: "Second" }
    ]);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("throws on invalid ports", () => {
    expect(() => normalizePortRequests([{ port: 70000 }])).toThrowError();
  });
});

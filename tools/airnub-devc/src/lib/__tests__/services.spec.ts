import { describe, expect, it } from "vitest";
import {
  assertServicesAllowed,
  filterServicesByStability,
  ServiceRegistry,
} from "../services.js";

describe("service registry gating", () => {
  const registry: ServiceRegistry = {
    services: [
      { id: "stable", label: "Stable", templatePath: "services/stable", stability: "stable" },
      { id: "exp", label: "Experimental", templatePath: "services/exp", stability: "experimental" },
      { id: "gone", label: "Deprecated", templatePath: "services/gone", stability: "deprecated" },
    ],
  };

  it("filters experimental services by default", () => {
    const filtered = filterServicesByStability(registry, {
      includeExperimental: false,
      includeDeprecated: false,
    });
    expect(filtered.map((svc) => svc.id)).toEqual(["stable"]);
  });

  it("allows opting into experimental services", () => {
    const filtered = filterServicesByStability(registry, {
      includeExperimental: true,
      includeDeprecated: false,
    });
    expect(filtered.map((svc) => svc.id)).toEqual(["stable", "exp"]);
  });

  it("throws when an experimental service is disallowed", () => {
    expect(() =>
      assertServicesAllowed(["exp"], registry, {
        includeExperimental: false,
        includeDeprecated: false,
      }),
    ).toThrow(/experimental and disabled by default/);
  });

  it("throws when a deprecated service is disallowed", () => {
    expect(() =>
      assertServicesAllowed(["gone"], registry, {
        includeExperimental: true,
        includeDeprecated: false,
      }),
    ).toThrow(/deprecated and disabled by default/);
  });

  it("permits explicitly opted-in experimental services", () => {
    const descriptors = assertServicesAllowed(["exp"], registry, {
      includeExperimental: true,
      includeDeprecated: false,
    });
    expect(descriptors.map((svc) => svc.id)).toEqual(["exp"]);
  });
});

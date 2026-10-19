import { describe, expect, test } from "bun:test";
import { connectionInput } from "./dokploy-validation";
import { unavailableEngineAction } from "./engine-policy";

describe("Dokploy credentials stay scoped to public HTTPS instances", () => {
  test("accepts an HTTPS domain", () => {
    expect(connectionInput.parse({ endpoint: "https://dokploy.example.com/", apiKey: "test-key-only-123" }).endpoint).toBe("https://dokploy.example.com");
  });
  test("rejects local and credential-bearing URLs", () => {
    for (const endpoint of ["http://dokploy.example.com", "https://127.0.0.1", "https://localhost", "https://x.internal", "https://user:pass@dokploy.example.com", "https://dokploy.example.com/path"]) {
      expect(connectionInput.safeParse({ endpoint, apiKey: "test-key-only-123" }).success).toBe(false);
    }
  });
});
test("unconfigured engine actions never return simulated success", () => {
  expect(unavailableEngineAction().ok).toBe(false);
});
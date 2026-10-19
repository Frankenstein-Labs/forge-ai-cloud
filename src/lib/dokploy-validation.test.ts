import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { connectionInput } from "./dokploy-validation";
import { unavailableEngineAction } from "./engine-policy";

describe("Dokploy credentials stay scoped to public HTTPS instances", () => {
  test("accepts an HTTPS domain", () => {
    assert.equal(connectionInput.parse({ endpoint: "https://dokploy.example.com/", apiKey: "test-key-only-123" }).endpoint, "https://dokploy.example.com");
  });
  test("rejects local and credential-bearing URLs", () => {
    for (const endpoint of ["http://dokploy.example.com", "https://127.0.0.1", "https://localhost", "https://x.internal", "https://user:pass@dokploy.example.com", "https://dokploy.example.com/path"]) {
      assert.equal(connectionInput.safeParse({ endpoint, apiKey: "test-key-only-123" }).success, false);
    }
  });
});
test("unconfigured engine actions never return simulated success", () => {
  assert.equal(unavailableEngineAction().ok, false);
});
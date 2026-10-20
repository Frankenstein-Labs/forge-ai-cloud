import { test } from "node:test";
import assert from "node:assert/strict";
import { googleCallbackUrl, safeAuthRedirect } from "./auth-redirect";

test("Google returns to a public page before dashboard access", () => {
  const url = new URL(googleCallbackUrl("https://forge-ai-cloud.lovable.app", "/dashboard/workspace"));
  assert.equal(url.origin, "https://forge-ai-cloud.lovable.app");
  assert.equal(url.pathname, "/auth");
  assert.equal(url.searchParams.get("redirect"), "/dashboard/workspace");
});
test("only internal destinations are retained and auth loops are rejected", () => {
  assert.equal(safeAuthRedirect("/dashboard/projects?view=all"), "/dashboard/projects?view=all");
  for (const path of ["https://other.example", "//other.example", "/\\other.example", "/auth", "/auth?redirect=/auth", undefined]) {
    assert.equal(safeAuthRedirect(path), "/dashboard");
  }
});
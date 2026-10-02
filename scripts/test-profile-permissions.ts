import assert from "node:assert/strict";
import { test } from "node:test";
import { isProfileAdmin } from "../src/lib/profile-permissions";

test("both active admin roles have access across profiles", () => {
  assert.equal(isProfileAdmin({ role: "ADMIN", isActive: true }), true);
  assert.equal(isProfileAdmin({ role: "SUPER_ADMIN", isActive: true }), true);
});

test("signed-out, inactive, and ordinary accounts do not receive admin access", () => {
  assert.equal(isProfileAdmin(null), false);
  for (const role of ["MEMBER", "PROFESSIONAL", "LISTING_MANAGER", "unknown"]) {
    assert.equal(isProfileAdmin({ role, isActive: true }), false);
  }
  for (const role of ["ADMIN", "SUPER_ADMIN"]) {
    assert.equal(isProfileAdmin({ role, isActive: false }), false);
  }
});

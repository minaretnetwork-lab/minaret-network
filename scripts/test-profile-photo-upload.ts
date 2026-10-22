import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { isProfileAdmin, profilePhotoEditWhere } from "../src/lib/profile-permissions";
import { isPhotoFraming } from "../src/lib/profile-photo-framing";

// Exercise the actual route with isolated auth, storage, and database boundaries.
function fixture(options: { signedIn?: boolean; active?: boolean; role?: string; allowed?: boolean; featured?: boolean; conflict?: boolean; uploadError?: boolean; noPhoto?: boolean } = {}) {
  const calls = { uploads: 0, removals: 0, updates: [] as unknown[], where: null as unknown };
  const professional = { photoUrl: options.noPhoto ? null : "https://example.com/old.webp", profileSlug: "test", user: null,
    isFeatured: options.featured ?? false, featuredListings: [] };
  const storage = {
    upload: async () => { calls.uploads++; return { error: options.uploadError ? new Error("Upload failed") : null }; },
    getPublicUrl: () => ({ data: { publicUrl: "https://example.com/new.webp" } }),
    remove: async () => { calls.removals++; },
  };
  const modules: Record<string, unknown> = {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/prisma": { prisma: {
      user: { findUnique: async () => ({ id: "editor", role: options.role ?? "ADMIN", isActive: options.active ?? true }) },
      professional: {
        findFirst: async ({ where }: { where: unknown }) => { calls.where = where; return options.allowed === false ? null : professional; },
        updateMany: async (query: unknown) => { calls.updates.push(query); return { count: options.conflict ? 0 : 1 }; },
      },
    } },
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: options.signedIn === false ? null : { id: "session" } } }) } }) },
    "@/lib/supabase/admin": { createAdminClient: () => ({ storage: { from: () => storage } }) },
    "@/lib/profile-permissions": { isProfileAdmin, profilePhotoEditWhere },
    "@/lib/public-asset-url": { getProfessionalDisplayPhotoUrl: ({ photoUrl }: { photoUrl: string }) => photoUrl },
    "@/lib/profile-photo-framing": { isPhotoFraming },
    "@/lib/upload-images": { optimizeUploadedImage: async () => ({ output: Buffer.from("image"), contentType: "image/webp", extension: "webp" }) },
  };
  const source = readFileSync("src/app/api/professionals/[id]/photo/route.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: { POST?: (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response> } = {};
  runInNewContext(compiled, { exports, require: (name: string) => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, Response, Request, File, FormData, URL, crypto, Buffer });
  return { calls, async send(sourceUrl = professional.photoUrl ?? "", framing: unknown = { x: 25, y: 75, zoom: 1.5 }) {
    const form = new FormData();
    form.set("sourceUrl", sourceUrl);
    form.set("framing", JSON.stringify(framing));
    form.set("photo", new File(["image"], "photo.webp", { type: "image/webp" }));
    return exports.POST!(new Request("https://example.com/api/professionals/listing/photo", { method: "POST", body: form }), { params: Promise.resolve({ id: "listing" }) });
  } };
}

test("signed-out, inactive, and unauthorized users cannot upload", async () => {
  for (const options of [{ signedIn: false }, { active: false }, { allowed: false, role: "MEMBER" }]) {
    const f = fixture(options);
    assert.ok([401, 403].includes((await f.send()).status));
    assert.equal(f.calls.uploads, 0);
    assert.equal(f.calls.updates.length, 0);
  }
});

test("owners use the existing ownership restrictions and featured review flow", async () => {
  const f = fixture({ role: "PROFESSIONAL", featured: true });
  assert.equal((await f.send()).status, 403);
  assert.equal(f.calls.uploads, 0);
});

test("stale photos and invalid framing are rejected before upload", async () => {
  const stale = fixture();
  assert.equal((await stale.send("https://example.com/stale.webp")).status, 409);
  assert.equal(stale.calls.uploads, 0);
  const invalid = fixture();
  assert.equal((await invalid.send(undefined, { x: 50, y: 50, zoom: 0 })).status, 400);
  assert.equal(invalid.calls.uploads, 0);
});

test("admins can replace featured photos and save framing with the new URL", async () => {
  const f = fixture({ featured: true });
  assert.equal((await f.send()).status, 200);
  const update = f.calls.updates[0] as { data: { photoUrl: string; photoFraming: { sourceUrl: string; x: number; y: number; zoom: number } }; where: { photoUrl: string } };
  assert.equal(update.where.photoUrl, "https://example.com/old.webp");
  assert.equal(update.data.photoUrl, "https://example.com/new.webp");
  assert.equal(update.data.photoFraming.sourceUrl, update.data.photoUrl);
  assert.equal(update.data.photoFraming.zoom, 1.5);
  assert.equal(f.calls.removals, 0);
});

test("conflicts clean up the new upload and failed uploads never update the profile", async () => {
  const conflict = fixture({ conflict: true });
  assert.equal((await conflict.send()).status, 409);
  assert.equal(conflict.calls.removals, 1);
  const failure = fixture({ uploadError: true });
  assert.equal((await failure.send()).status, 500);
  assert.equal(failure.calls.updates.length, 0);
});

test("an admin-created listing without an owner or picture can receive its first photo", async () => {
  const f = fixture({ noPhoto: true });
  assert.equal((await f.send()).status, 200);
  const query = f.calls.updates[0] as { where: { photoUrl: null; user: { is: null } } };
  assert.equal(query.where.photoUrl, null);
  assert.equal(query.where.user.is, null);
});

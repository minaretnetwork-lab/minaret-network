import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PHOTO_FRAMING, getPhotoFraming, isPhotoFraming, photoOverflow } from "../src/lib/profile-photo-framing";

test("framing rejects non-finite values, invalid bounds, and zoom that exposes empty space", () => {
  for (const value of [null, {}, { x: NaN, y: 50, zoom: 1 }, { x: 50, y: Infinity, zoom: 1 },
    { x: -1, y: 50, zoom: 1 }, { x: 50, y: 101, zoom: 1 }, { x: 50, y: 50, zoom: 0.9 },
    { x: 50, y: 50, zoom: 3.01 }, { x: "50", y: 50, zoom: 1 }]) {
    assert.equal(isPhotoFraming(value), false);
  }
  assert.equal(isPhotoFraming({ x: 0, y: 100, zoom: 3 }), true);
});

test("replacing a photo resets its framing, while reloading the same photo keeps it", () => {
  const saved = { sourceUrl: "https://example.com/photo.webp?t=1", x: 20, y: 80, zoom: 2 };
  assert.deepEqual(getPhotoFraming(saved, saved.sourceUrl), { x: 20, y: 80, zoom: 2 });
  assert.deepEqual(getPhotoFraming(saved, "https://example.com/photo.webp?t=2"), DEFAULT_PHOTO_FRAMING);
  assert.deepEqual(getPhotoFraming(null, saved.sourceUrl), DEFAULT_PHOTO_FRAMING);
});

test("dragging uses the cropped overflow for portrait, landscape, and zoomed images", () => {
  assert.deepEqual(photoOverflow(400, 300, 1, 1), { x: 0, y: 100 });
  assert.deepEqual(photoOverflow(400, 300, 2, 1), { x: 200, y: 0 });
  assert.deepEqual(photoOverflow(400, 300, 4 / 3, 2), { x: 400, y: 300 });
  // At any position from 0–100%, both edges still cover the viewport.
  for (const ratio of [0.5, 1, 4 / 3, 2, 4]) {
    for (const zoom of [1, 1.5, 3]) {
      const overflow = photoOverflow(400, 300, ratio, zoom);
      for (const position of [0, 0.2, 0.5, 0.8, 1]) {
        assert.ok(overflow.x * position >= 0 && overflow.x * position <= overflow.x);
        assert.ok(overflow.y * position >= 0 && overflow.y * position <= overflow.y);
      }
    }
  }
});

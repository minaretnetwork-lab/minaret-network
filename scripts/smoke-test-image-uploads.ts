import sharp from "sharp";
import { optimizeUploadedImage } from "@/lib/upload-images";

function createTestFile(buffer: Buffer, name: string, type: string) {
  return new File([new Uint8Array(buffer)], name, { type, lastModified: Date.now() });
}

async function generateFixtures() {
  const noisyRgb = Buffer.alloc(4200 * 2800 * 3);
  for (let index = 0; index < noisyRgb.length; index += 1) {
    noisyRgb[index] = index % 251;
  }

  const largeJpeg = await sharp(noisyRgb, {
    raw: {
      width: 4200,
      height: 2800,
      channels: 3,
    },
  })
    .jpeg({ quality: 94 })
    .toBuffer();

  const transparentPng = await sharp({
    create: {
      width: 2200,
      height: 2200,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: {
            width: 1400,
            height: 1400,
            channels: 4,
            background: { r: 22, g: 163, b: 74, alpha: 1 },
          },
        })
          .png()
          .toBuffer(),
        top: 400,
        left: 400,
      },
    ])
    .png()
    .toBuffer();

  const webp = await sharp({
    create: {
      width: 1800,
      height: 1200,
      channels: 3,
      background: { r: 248, g: 250, b: 252 },
    },
  })
    .webp({ quality: 88 })
    .toBuffer();

  return [
    { label: "Large JPEG photo", variant: "photo" as const, file: createTestFile(largeJpeg, "large-photo.jpg", "image/jpeg") },
    { label: "Transparent PNG logo", variant: "logo" as const, file: createTestFile(transparentPng, "logo.png", "image/png") },
    { label: "WebP photo", variant: "photo" as const, file: createTestFile(webp, "photo.webp", "image/webp") },
  ];
}

async function main() {
  const fixtures = await generateFixtures();

  for (const fixture of fixtures) {
    const result = await optimizeUploadedImage(fixture.file, fixture.variant);
    console.log(
      JSON.stringify({
        label: fixture.label,
        inputType: fixture.file.type,
        inputBytes: fixture.file.size,
        outputType: result.contentType,
        outputBytes: result.output.byteLength,
        width: result.width,
        height: result.height,
      }),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

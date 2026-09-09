/**
 * Depth maps for the lounge scene, from Depth Anything v2 (small) running in
 * Node through transformers.js. The model lives in a throwaway folder
 * (.lounge-tmp.nosync/depth) so it never touches the project's dependencies.
 *   node scripts/lounge-depth.mjs
 * Writes .lounge-tmp.nosync/{hookah,bar}-depth.png (near = bright).
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
const here = process.cwd();
const req = createRequire(pathToFileURL(`${here}/.lounge-tmp.nosync/depth/package.json`));
const { pipeline, env } = req("@huggingface/transformers");
env.cacheDir = `${here}/.lounge-tmp.nosync/depth/.cache`;
const estimate = await pipeline("depth-estimation", "onnx-community/depth-anything-v2-small", { dtype: "fp32" });
for (const name of ["hookah", "bar"]) {
  const src = `${here}/assets/lounge/${name}.jpg`;
  const t0 = Date.now();
  const { depth } = await estimate(src);
  // depth is a RawImage, single channel, already scaled 0..255 with near = bright
  const { width, height, data } = depth;
  const meta = await sharp(src).metadata();
  await sharp(Buffer.from(data), { raw: { width, height, channels: 1 } })
    .resize(meta.width, meta.height, { kernel: "lanczos3" })
    .png()
    .toFile(`${here}/.lounge-tmp.nosync/${name}-depth.png`);
  console.log(`${name}: ${width}x${height} → ${meta.width}x${meta.height} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

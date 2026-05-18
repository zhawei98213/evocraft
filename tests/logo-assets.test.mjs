import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const EXPECTED_ASSETS = [
  ["src/assets/evocraft-logo.png", 256, 256],
  ["public/evocraft-logo.png", 256, 256],
  ["public/favicon.png", 32, 32],
];

for (const [filePath, expectedWidth, expectedHeight] of EXPECTED_ASSETS) {
  const png = readPng(filePath);
  assert.equal(png.width, expectedWidth, `${filePath} width`);
  assert.equal(png.height, expectedHeight, `${filePath} height`);
  assert.equal(png.colorType, 6, `${filePath} should be RGBA`);
  assert.equal(png.getPixel(0, 0).alpha, 0, `${filePath} top-left corner should be transparent`);
  assert.equal(
    png.getPixel(png.width - 1, 0).alpha,
    0,
    `${filePath} top-right corner should be transparent`,
  );
  assert.equal(
    png.getPixel(0, png.height - 1).alpha,
    0,
    `${filePath} bottom-left corner should be transparent`,
  );
  assert.equal(
    png.getPixel(png.width - 1, png.height - 1).alpha,
    0,
    `${filePath} bottom-right corner should be transparent`,
  );
  assert.equal(
    png.getPixel(Math.floor(png.width / 2), Math.floor(png.height / 2)).alpha,
    255,
    `${filePath} center should remain opaque`,
  );
}

function readPng(filePath) {
  const data = readFileSync(filePath);
  const signature = data.subarray(0, 8).toString("hex");
  assert.equal(signature, "89504e470d0a1a0a", `${filePath} should be a PNG`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString("ascii");
    const chunkData = data.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
      const bitDepth = chunkData.readUInt8(8);
      colorType = chunkData.readUInt8(9);
      assert.equal(bitDepth, 8, `${filePath} should use 8-bit channels`);
    }

    if (type === "IDAT") {
      idatChunks.push(chunkData);
    }

    if (type === "IEND") break;
  }

  assert.equal(colorType, 6, `${filePath} should use RGBA color type`);
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const row = inflated.subarray(sourceOffset, sourceOffset + stride);
    sourceOffset += stride;
    const previousRow = y === 0 ? null : pixels.subarray((y - 1) * stride, y * stride);
    const targetRow = pixels.subarray(y * stride, (y + 1) * stride);
    unfilterRow(filter, row, targetRow, previousRow, bytesPerPixel);
  }

  return {
    width,
    height,
    colorType,
    getPixel(x, y) {
      const pixelOffset = (y * width + x) * bytesPerPixel;
      return {
        red: pixels[pixelOffset],
        green: pixels[pixelOffset + 1],
        blue: pixels[pixelOffset + 2],
        alpha: pixels[pixelOffset + 3],
      };
    },
  };
}

function unfilterRow(filter, source, target, previousRow, bytesPerPixel) {
  for (let index = 0; index < source.length; index += 1) {
    const left = index >= bytesPerPixel ? target[index - bytesPerPixel] : 0;
    const up = previousRow ? previousRow[index] : 0;
    const upLeft = previousRow && index >= bytesPerPixel ? previousRow[index - bytesPerPixel] : 0;

    if (filter === 0) target[index] = source[index];
    else if (filter === 1) target[index] = (source[index] + left) & 0xff;
    else if (filter === 2) target[index] = (source[index] + up) & 0xff;
    else if (filter === 3) target[index] = (source[index] + Math.floor((left + up) / 2)) & 0xff;
    else if (filter === 4) target[index] = (source[index] + paethPredictor(left, up, upLeft)) & 0xff;
    else throw new Error(`Unsupported PNG filter type: ${filter}`);
  }
}

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

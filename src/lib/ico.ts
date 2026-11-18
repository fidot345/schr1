const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;

export type IcoImage = {
  size: number;
  png: Uint8Array;
};

/**
 * Packs square PNG images into one .ico file.
 * Modern browsers read PNG data inside ICO directly, so no BMP conversion is needed.
 */
export function packIco(images: IcoImage[]): Uint8Array {
  const dataSize = images.reduce((sum, image) => sum + image.png.length, 0);
  const tableSize = HEADER_SIZE + ENTRY_SIZE * images.length;
  const bytes = new Uint8Array(tableSize + dataSize);
  const view = new DataView(bytes.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let offset = tableSize;
  images.forEach((image, index) => {
    if (image.size < 1 || image.size > 256) {
      throw new RangeError(`ICO image size must be 1…256, got ${image.size}`);
    }
    const entry = HEADER_SIZE + ENTRY_SIZE * index;
    const side = image.size === 256 ? 0 : image.size;
    view.setUint8(entry, side);
    view.setUint8(entry + 1, side);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, image.png.length, true);
    view.setUint32(entry + 12, offset, true);
    bytes.set(image.png, offset);
    offset += image.png.length;
  });

  return bytes;
}

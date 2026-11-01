const LIMIT = 5 * 1024 * 1024;
const invalid = () =>
  new Error(
    "Choose a valid, still JPEG, PNG or WebP photo with a matching file extension.",
  );
const excessive = () =>
  new Error(
    "Use a photo under 5 MiB, at most 16 million pixels and 8,192 pixels on either side.",
  );

/** Inspect bounded header bytes before asking the browser to decode pixels. */
export async function validatePhoto(file: File): Promise<void> {
  if (!file.size || file.size > LIMIT) throw excessive();
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["jpg", "jpeg", "png", "webp"].includes(extension))
    throw invalid();
  const data = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(data.buffer);
  const text = (start: number, length: number) =>
    String.fromCharCode(...data.subarray(start, start + length));
  let width = 0,
    height = 0,
    format = "";
  if (data.length >= 24 && text(1, 3) === "PNG" && data[0] === 137) {
    format = "png";
    width = view.getUint32(16);
    height = view.getUint32(20);
    for (let offset = 8; offset + 12 <= data.length;) {
      const length = view.getUint32(offset);
      if (text(offset + 4, 4) === "acTL")
        throw new Error(
          "Animated photos are not supported. Choose a still image.",
        );
      if (length > data.length - offset - 12) throw invalid();
      offset += length + 12;
    }
  } else if (
    data.length >= 30 &&
    text(0, 4) === "RIFF" &&
    text(8, 4) === "WEBP"
  ) {
    format = "webp";
    for (let offset = 12; offset + 8 <= data.length;) {
      const chunk = text(offset, 4),
        length = view.getUint32(offset + 4, true),
        start = offset + 8;
      if (length > data.length - start) throw invalid();
      if (
        chunk === "ANIM" ||
        chunk === "ANMF" ||
        (chunk === "VP8X" && data[start] & 2)
      )
        throw new Error(
          "Animated photos are not supported. Choose a still image.",
        );
      if (chunk === "VP8X" && length >= 10) {
        width =
          1 +
          data[start + 4] +
          (data[start + 5] << 8) +
          (data[start + 6] << 16);
        height =
          1 +
          data[start + 7] +
          (data[start + 8] << 8) +
          (data[start + 9] << 16);
      } else if (chunk === "VP8 " && length >= 10 && !width) {
        width = view.getUint16(start + 6, true) & 0x3fff;
        height = view.getUint16(start + 8, true) & 0x3fff;
      } else if (chunk === "VP8L" && length >= 5 && !width) {
        const bits = view.getUint32(start + 1, true);
        width = (bits & 0x3fff) + 1;
        height = ((bits >>> 14) & 0x3fff) + 1;
      }
      offset = start + length + (length % 2);
    }
  } else if (data.length >= 4 && data[0] === 255 && data[1] === 216) {
    format = "jpeg";
    for (let offset = 2; offset + 4 <= data.length;) {
      if (data[offset++] !== 255) throw invalid();
      while (data[offset] === 255) offset++;
      const marker = data[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > data.length) throw invalid();
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > data.length) throw invalid();
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker) &&
        length >= 7
      ) {
        height = view.getUint16(offset + 3);
        width = view.getUint16(offset + 5);
        break;
      }
      offset += length;
    }
  }
  if (
    !width ||
    !height ||
    format !== (extension === "jpg" ? "jpeg" : extension)
  )
    throw invalid();
  if (width > 8192 || height > 8192 || width * height > 16_000_000)
    throw excessive();
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw invalid();
  }
  bitmap.close();
}

/** Reduz uma foto no telemóvel (lado maior 1800 px, JPEG): envia-se depressa e cabe no limite. Se falhar, segue a original. */
export async function shrinkImage(file: File, name: string): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], name, { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

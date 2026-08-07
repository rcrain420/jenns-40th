import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function uploadCatchPhoto(input: {
  id: string;
  bytes: Buffer;
  mime: string;
  ext: string;
}): Promise<string> {
  const filename = `catches/${input.id}.${input.ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, input.bytes, {
      access: "public",
      contentType: input.mime,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const relativePath = `/uploads/catches/${input.id}.${input.ext}`;
  const absoluteDir = path.join(process.cwd(), "public", "uploads", "catches");
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, `${input.id}.${input.ext}`), input.bytes);
  return relativePath;
}

import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put, get, del } from "@vercel/blob";
import { db } from "./db";

const LOCAL_DIR = path.join(process.cwd(), ".uploads");
const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export class UploadError extends Error {}

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".zip": "application/zip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".csv": "text/csv",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xml": "application/xml",
};

// Magic-byte signatures used to verify that the content matches its extension.
function signatureOk(ext: string, buf: Buffer) {
  const hex = buf.subarray(0, 8).toString("hex");
  switch (ext) {
    case ".pdf": return buf.subarray(0, 5).toString() === "%PDF-";
    case ".docx": case ".xlsx": case ".zip": return hex.startsWith("504b0304") || hex.startsWith("504b0506");
    case ".doc": return hex.startsWith("d0cf11e0a1b11ae1");
    case ".png": return hex.startsWith("89504e47");
    case ".jpg": case ".jpeg": return hex.startsWith("ffd8ff");
    case ".gif": return hex.startsWith("47494638");
    case ".webp": return buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP";
    default: return true;
  }
}

// Basic malware screening: rejects EICAR test string, embedded executables and active PDF content.
// For production, connect a dedicated scanning service (e.g. ClamAV) via MALWARE_SCAN_URL.
async function scan(buf: Buffer, ext: string) {
  const head = buf.subarray(0, Math.min(buf.length, 2 * 1024 * 1024)).toString("latin1");
  if (head.includes("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR")) throw new UploadError("File failed malware screening.");
  if (buf.subarray(0, 2).toString() === "MZ") throw new UploadError("Executable files are not permitted.");
  if (ext === ".pdf" && /\/JavaScript|\/Launch|\/EmbeddedFile/.test(head)) throw new UploadError("PDF contains active content (JavaScript/launch actions) and was rejected.");
  if (process.env.MALWARE_SCAN_URL) {
    const r = await fetch(process.env.MALWARE_SCAN_URL, { method: "POST", body: new Uint8Array(buf), headers: { "content-type": "application/octet-stream" } });
    if (!r.ok) throw new UploadError("File failed malware screening.");
  }
}

export async function maxUploadBytes() {
  const j = await db.journal.findUnique({ where: { id: "journal" }, select: { maxUploadMb: true } });
  return (j?.maxUploadMb ?? 4) * 1024 * 1024;
}

export function isRealFile(f: FormDataEntryValue | null): f is File {
  return !!f && typeof f !== "string" && f.size > 0 && !!f.name;
}

export async function storeFile(
  file: File,
  opts: { allowed: string[]; folder: string; uploadedById?: string | null; visibility?: "PRIVATE" | "PUBLIC" },
) {
  const ext = path.extname(file.name).toLowerCase();
  if (!opts.allowed.includes(ext)) throw new UploadError(`File type ${ext || "(none)"} not allowed. Allowed: ${opts.allowed.join(", ")}`);
  const max = await maxUploadBytes();
  if (file.size > max) throw new UploadError(`File "${file.name}" exceeds the ${Math.round(max / 1048576)} MB limit.`);
  const buf = Buffer.from(await file.arrayBuffer());
  if (!signatureOk(ext, buf)) throw new UploadError(`File "${file.name}" content does not match its ${ext} extension.`);
  await scan(buf, ext);
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-100);
  const key = `${opts.folder}/${crypto.randomBytes(12).toString("hex")}-${safeName}`;
  const mimeType = MIME[ext] ?? "application/octet-stream";
  if (useBlob()) {
    await put(key, buf, { access: "private", contentType: mimeType, addRandomSuffix: false });
  } else {
    const p = path.join(LOCAL_DIR, key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, buf);
  }
  return db.storedFile.create({
    data: { storageKey: key, originalName: file.name, mimeType, size: file.size, sha256, visibility: opts.visibility ?? "PRIVATE", uploadedById: opts.uploadedById ?? null },
  });
}

export async function storeBuffer(buf: Buffer, name: string, mimeType: string, folder: string, uploadedById?: string | null) {
  const key = `${folder}/${crypto.randomBytes(12).toString("hex")}-${name}`;
  if (useBlob()) await put(key, buf, { access: "private", contentType: mimeType, addRandomSuffix: false });
  else {
    const p = path.join(LOCAL_DIR, key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, buf);
  }
  return db.storedFile.create({ data: { storageKey: key, originalName: name, mimeType, size: buf.length, uploadedById: uploadedById ?? null } });
}

export async function readFileStream(storageKey: string): Promise<ReadableStream | null> {
  if (useBlob()) {
    const r = await get(storageKey, { access: "private" });
    return (r?.stream as ReadableStream) ?? null;
  }
  try {
    const data = await fs.readFile(path.join(LOCAL_DIR, storageKey));
    return new Blob([new Uint8Array(data)]).stream();
  } catch {
    return null;
  }
}

export async function deleteStoredFile(id: string) {
  const f = await db.storedFile.findUnique({ where: { id } });
  if (!f) return;
  try {
    if (useBlob()) await del(f.storageKey);
    else await fs.unlink(path.join(LOCAL_DIR, f.storageKey));
  } catch {}
}

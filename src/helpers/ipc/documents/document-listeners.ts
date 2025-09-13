import { BrowserWindow, app, dialog, ipcMain, shell } from "electron";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  DOCS_ACCEPTED_TYPES_CHANNEL,
  DOCS_DELETE_CHANNEL,
  DOCS_DOWNLOAD_CHANNEL,
  DOCS_LIST_CHANNEL,
  DOCS_OPEN_CHANNEL,
  DOCS_PROGRESS_CHANNEL,
  DOCS_UPLOAD_CHANNEL,
} from "./document-channels";

export interface DocumentIndexEntry {
  id: string;
  fileName: string;
  fileSize: number;
  uploadTimestamp: number;
  category: string;
  mimeType: string;
  extension: string;
  storedPath: string;
  thumbnailPath?: string;
  // Optional granular context
  contextId?: string;
  contextLabel?: string;
  groupKey?: string;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".txt"];

function getUserDataDir(): string {
  return app.getPath("userData");
}

function getDocsDir(): string {
  const base = path.join(getUserDataDir(), "documents");
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  return base;
}

function getIndexPath(): string {
  const idxDir = getDocsDir();
  return path.join(idxDir, "index.json");
}

async function readIndex(): Promise<DocumentIndexEntry[]> {
  const indexPath = getIndexPath();
  try {
    const raw = await fsp.readFile(indexPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeIndex(entries: DocumentIndexEntry[]): Promise<void> {
  const indexPath = getIndexPath();
  await fsp.writeFile(indexPath, JSON.stringify(entries, null, 2), "utf-8");
}

function computeThumbnailPath(storedPath: string, ext: string): string | undefined {
  const lower = ext.toLowerCase();
  if (lower === ".png" || lower === ".jpg" || lower === ".jpeg") {
    return storedPath; // use original image for preview; scaled in UI
  }
  return undefined;
}

export function addDocumentEventListeners(mainWindow: BrowserWindow) {
  ipcMain.handle(DOCS_ACCEPTED_TYPES_CHANNEL, async () => ACCEPTED_EXTENSIONS);

  ipcMain.handle(DOCS_LIST_CHANNEL, async () => {
    const entries = await readIndex();
    return entries.map(({ thumbnailPath, ...rest }) => ({ ...rest, thumbnailPath }));
  });

  ipcMain.handle(DOCS_UPLOAD_CHANNEL, async (_event, { filePaths, category, context }: { filePaths: string[]; category: string; context?: { contextId?: string; contextLabel?: string; groupKey?: string } }) => {
    const results: Array<{ ok: boolean; document?: Omit<DocumentIndexEntry, "storedPath">; error?: string }> = [];
    for (const src of filePaths) {
      try {
        const ext = path.extname(src).toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          results.push({ ok: false, error: `Unsupported file type: ${ext}` });
          continue;
        }

        const id = randomUUID();
        const baseName = path.basename(src);
        const dest = path.join(getDocsDir(), `${id}${ext}`);

        const stat = await fsp.stat(src);
        const totalBytes = stat.size;

        // Use a larger chunk size to reduce IPC traffic and improve throughput
        const readStream = fs.createReadStream(src, { highWaterMark: 1024 * 1024 * 4 }); // 4MB
        const writeStream = fs.createWriteStream(dest);

        let copied = 0;
        let lastSentPct = -1;
        let lastSentAt = 0;
        const maybeEmit = (progress: number, status: "uploading" | "success" | "error") => {
          const now = Date.now();
          if (progress === 100 || progress >= lastSentPct + 1 || now - lastSentAt >= 120) {
            lastSentPct = progress;
            lastSentAt = now;
            mainWindow.webContents.send(DOCS_PROGRESS_CHANNEL, {
              id,
              progress,
              status,
              fileName: baseName,
              fileSize: totalBytes,
              extension: ext,
              category,
              contextId: context?.contextId,
              contextLabel: context?.contextLabel,
              groupKey: context?.groupKey,
            });
          }
        };

        // Emit an initial progress event to show immediate feedback
        maybeEmit(0, "uploading");

        readStream.on("data", (chunk) => {
          copied += chunk.length;
          const progress = Math.min(100, Math.floor((copied / totalBytes) * 100));
          maybeEmit(progress, "uploading");
        });

        await new Promise<void>((resolve, reject) => {
          readStream.pipe(writeStream);
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
          readStream.on("error", reject);
        });

        const thumb = computeThumbnailPath(dest, ext);

        const entry: DocumentIndexEntry = {
          id,
          fileName: baseName,
          fileSize: totalBytes,
          uploadTimestamp: Date.now(),
          category,
          mimeType: ext === ".pdf" ? "application/pdf" : ext === ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : ext === ".xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : ext === ".txt" ? "text/plain" : lowerImageToMime(ext),
          extension: ext,
          storedPath: dest,
          thumbnailPath: thumb,
          contextId: context?.contextId,
          contextLabel: context?.contextLabel,
          groupKey: context?.groupKey,
        };

        const entries = await readIndex();
        entries.push(entry);
        await writeIndex(entries);

        maybeEmit(100, "success");
        const { storedPath, ...meta } = entry;
        results.push({ ok: true, document: meta });
      } catch (err: any) {
        results.push({ ok: false, error: err?.message || "Upload failed" });
      }
    }

    return results;
  });

  ipcMain.handle(DOCS_DELETE_CHANNEL, async (_event, { id }: { id: string }) => {
    const entries = await readIndex();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return { ok: false };
    const [entry] = entries.splice(idx, 1);
    await writeIndex(entries);
    try {
      if (fs.existsSync(entry.storedPath)) await fsp.unlink(entry.storedPath);
      if (entry.thumbnailPath && fs.existsSync(entry.thumbnailPath)) await fsp.unlink(entry.thumbnailPath);
    } catch {}
    return { ok: true };
  });

  ipcMain.handle(DOCS_DOWNLOAD_CHANNEL, async (_event, { id }: { id: string }) => {
    const entries = await readIndex();
    const entry = entries.find((e) => e.id === id);
    if (!entry) return { ok: false };
    const result = await dialog.showSaveDialog({ defaultPath: entry.fileName });
    if (result.canceled || !result.filePath) return { ok: false };
    await fsp.copyFile(entry.storedPath, result.filePath);
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle(DOCS_OPEN_CHANNEL, async (_event, { id }: { id: string }) => {
    const entries = await readIndex();
    const entry = entries.find((e) => e.id === id);
    if (!entry) return { ok: false };
    await shell.openPath(entry.storedPath);
    return { ok: true };
  });
}

function lowerImageToMime(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}



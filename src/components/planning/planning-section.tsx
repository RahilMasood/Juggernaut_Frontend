"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { getCompanyName } from "@/lib/textron-data-processor";
import { Progress } from "../ui/progress";

import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  XCircle,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";

function UploadInline({
  sectionKey,
  groupKey,
  itemId,
  itemQuestion,
  buttonLabel = "Attach documents",
  compact = false,
}: {
  sectionKey: string;
  groupKey?: string;
  itemId: string;
  itemQuestion?: string;
  buttonLabel?: string;
  compact?: boolean;
}) {
  const [uploads, setUploads] = useState<
    Record<
      string,
      {
        id: string;
        fileName: string;
        fileSize?: number;
        extension?: string;
        progress: number;
        status: "uploading" | "success" | "error";
        error?: string;
        previewUrl?: string;
        temp?: boolean;
      }
    >
  >({});

  const formatSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let u = 0;
    while (size > 1024 && u < units.length - 1) {
      size /= 1024;
      u++;
    }
    return `${size.toFixed(1)} ${units[u]}`;
  };

  const iconForExt = (ext?: string) => {
    const e = (ext || "").toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(e))
      return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  useEffect(() => {
    const off = (window as any).documents.onProgress(
      (payload: {
        id: string;
        progress: number;
        status: "uploading" | "success" | "error";
        error?: string;
        fileName?: string;
        fileSize?: number;
        extension?: string;
        category?: string;
        contextId?: string;
        contextLabel?: string;
        groupKey?: string;
      }) => {
        if (
          payload.category !== sectionKey ||
          payload.contextId !== itemId ||
          payload.groupKey !== groupKey
        ) {
          return;
        }
        setUploads((prev) => {
          const temps = Object.entries(prev).filter(
            ([, v]) =>
              v.temp &&
              v.fileName === payload.fileName &&
              v.fileSize === payload.fileSize,
          );
          let next = { ...prev } as typeof prev;
          if (temps.length > 0) {
            const [, tempVal] = temps[0];
            delete next[tempVal.id];
            next[payload.id] = {
              id: payload.id,
              fileName: payload.fileName || tempVal.fileName,
              fileSize: payload.fileSize ?? tempVal.fileSize,
              extension: payload.extension ?? tempVal.extension,
              progress: payload.progress,
              status: payload.status,
              error: payload.error,
              previewUrl: tempVal.previewUrl,
            };
          } else {
            next[payload.id] = {
              id: payload.id,
              fileName: payload.fileName || payload.id,
              fileSize: payload.fileSize,
              extension: payload.extension,
              progress: payload.progress,
              status: payload.status,
              error: payload.error,
            };
          }
          return next;
        });
      },
    );
    return () => off && off();
  }, [sectionKey, groupKey, itemId]);

  const addPendingFromFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const now = Date.now();
    const entries: Record<string, any> = {};
    Array.from(fileList).forEach((f, idx) => {
      const id = `temp-${now}-${idx}`;
      const name = (f as File).name;
      const size = (f as File).size;
      const dot = name.lastIndexOf(".");
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
      let previewUrl: string | undefined;
      if ([".png", ".jpg", ".jpeg"].includes(ext)) {
        try {
          previewUrl = URL.createObjectURL(f as File);
        } catch {}
      }
      entries[id] = {
        id,
        fileName: name,
        fileSize: size,
        extension: ext,
        progress: 0,
        status: "uploading" as const,
        previewUrl,
        temp: true,
      };
    });
    setUploads((prev) => ({ ...prev, ...entries }));
  };

  const handlePickFiles = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = (await (window as any).documents.acceptedTypes()).join(",");
    input.onchange = async () => {
      const files = (input.files || []) as unknown as FileList;
      try {
        await addPendingFromFiles(files);
      } catch {}
      const paths: string[] = [];
      for (const f of Array.from(files)) {
        const fwp = f as unknown as { path?: string };
        if (fwp.path) paths.push(fwp.path);
      }
      if (paths.length) {
        const label = `${itemId}${itemQuestion ? ` • ${itemQuestion}` : ""}`;
        await (window as any).documents.upload(paths, sectionKey, {
          contextId: itemId,
          contextLabel: label,
          groupKey,
        });
      }
    };
    input.click();
  };

  const items = Object.values(uploads);

  return (
    <div className={compact ? "" : "space-y-2"}>
      <button
        type="button"
        className={
          compact
            ? "rounded bg-white/10 px-2 py-1 text-[11px] text-white hover:bg-white/20"
            : "h-10 w-full rounded-md border border-white/10 bg-white/10 text-xs text-white hover:bg-white/20"
        }
        onClick={handlePickFiles}
      >
        {buttonLabel}
      </button>
      {items.length > 0 && (
        <div className="mt-2 space-y-2">
          {items.map((u) => (
            <div
              key={u.id}
              className="animate-in fade-in slide-in-from-top-1 rounded-md border border-white/10 bg-white/5 p-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-white/10">
                  {[".png", ".jpg", ".jpeg"].includes(
                    (u.extension || "").toLowerCase(),
                  ) && u.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.previewUrl}
                      alt={u.fileName}
                      className="h-10 w-10 object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="text-white/70">
                      {iconForExt(u.extension)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-xs text-white/90"
                    title={u.fileName}
                  >
                    {u.fileName}
                  </div>
                  <div className="text-[10px] text-white/50">
                    {formatSize(u.fileSize)} •{" "}
                    {u.status === "success" ? (
                      <span className="text-emerald-400">Loaded</span>
                    ) : u.status === "error" ? (
                      <span className="text-red-400">Error</span>
                    ) : (
                      <span className="text-white/70">Processing…</span>
                    )}
                  </div>
                  {u.status === "uploading" && (
                    <div className="mt-1">
                      <Progress value={u.progress} />
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {u.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : u.status === "error" ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type SectionKey =
  | "engagement-acceptance"
  | "fraud-risk"
  | "it-risk"
  | "materiality"
  | "preliminary-analytical"
  | "understanding-entity";

interface PlanningSectionProps {
  sectionKey: SectionKey;
  title: string;
}

type JsonValue = any;

function getTopLevelTabsForContent(
  content: JsonValue,
): Array<{ key: string; title: string; items?: any[] }> {
  // Each JSON has a single top-level key mapping to either an array or grouped sections
  const rootKeys = Object.keys(content || {});
  if (rootKeys.length === 0) return [];
  const firstKey = rootKeys[0];
  const root = content[firstKey];

  if (Array.isArray(root)) {
    return [{ key: firstKey, title: firstKey, items: root }];
  }
  if (typeof root === "object" && root) {
    return Object.entries(root).map(([k, v]) => ({
      key: k,
      title: k,
      items: Array.isArray(v) ? (v as any[]) : undefined,
    }));
  }
  return [{ key: firstKey, title: firstKey, items: [] }];
}

function SimpleTableEditor({
  rows,
  onChange,
}: {
  rows: any[] | undefined;
  onChange: (next: any[]) => void;
}) {
  const value = Array.isArray(rows) ? rows : [];
  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...value, ""])}
      >
        Add Row
      </Button>
      <div className="space-y-2">
        {value.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={row ?? ""}
              onChange={(e) => {
                const next = [...value];
                next[idx] = e.target.value;
                onChange(next);
              }}
              className="text-white"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const next = [...value];
                next.splice(idx, 1);
                onChange(next);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRenderer({
  item,
  value,
  onChange,
  sectionKey,
  groupKey,
}: {
  item: any;
  value: any;
  onChange: (val: any) => void;
  sectionKey: SectionKey;
  groupKey?: string;
}) {
  const type = item.type as string;
  const disabled = false;
  const [uploads, setUploads] = useState<
    Record<
      string,
      {
        id: string;
        fileName: string;
        fileSize?: number;
        extension?: string;
        progress: number;
        status: "uploading" | "success" | "error";
        error?: string;
        previewUrl?: string;
        temp?: boolean;
      }
    >
  >({});

  const formatSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let u = 0;
    while (size > 1024 && u < units.length - 1) {
      size /= 1024;
      u++;
    }
    return `${size.toFixed(1)} ${units[u]}`;
  };

  const iconForExt = (ext?: string) => {
    const e = (ext || "").toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(e))
      return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Subscribe to global upload progress, filter to this question context
  useEffect(() => {
    const off = (window as any).documents.onProgress(
      (payload: {
        id: string;
        progress: number;
        status: "uploading" | "success" | "error";
        error?: string;
        fileName?: string;
        fileSize?: number;
        extension?: string;
        category?: string;
        contextId?: string;
        contextLabel?: string;
        groupKey?: string;
      }) => {
        if (
          payload.category !== sectionKey ||
          payload.contextId !== item.id ||
          payload.groupKey !== groupKey
        ) {
          return;
        }
        setUploads((prev) => {
          // Try to reconcile any temp entries by name+size
          const temps = Object.entries(prev).filter(
            ([, v]) =>
              v.temp &&
              v.fileName === payload.fileName &&
              v.fileSize === payload.fileSize,
          );
          let next = { ...prev };
          if (temps.length > 0) {
            const [, tempVal] = temps[0];
            delete next[tempVal.id];
            next[payload.id] = {
              id: payload.id,
              fileName: payload.fileName || tempVal.fileName,
              fileSize: payload.fileSize ?? tempVal.fileSize,
              extension: payload.extension ?? tempVal.extension,
              progress: payload.progress,
              status: payload.status,
              error: payload.error,
              previewUrl: tempVal.previewUrl,
            };
          } else {
            next[payload.id] = {
              id: payload.id,
              fileName: payload.fileName || payload.id,
              fileSize: payload.fileSize,
              extension: payload.extension,
              progress: payload.progress,
              status: payload.status,
              error: payload.error,
            };
          }
          return next;
        });
      },
    );
    return () => off && off();
  }, [sectionKey, groupKey, item.id]);

  const addPendingFromFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const now = Date.now();
    const entries: Record<string, any> = {};
    Array.from(fileList).forEach((f, idx) => {
      const id = `temp-${now}-${idx}`;
      const name = (f as File).name;
      const size = (f as File).size;
      const dot = name.lastIndexOf(".");
      const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
      let previewUrl: string | undefined;
      if ([".png", ".jpg", ".jpeg"].includes(ext)) {
        try {
          previewUrl = URL.createObjectURL(f as File);
        } catch {}
      }
      entries[id] = {
        id,
        fileName: name,
        fileSize: size,
        extension: ext,
        progress: 0,
        status: "uploading" as const,
        previewUrl,
        temp: true,
      };
    });
    setUploads((prev) => ({ ...prev, ...entries }));
  };

  const renderUploadIndicators = () => {
    const list = Object.values(uploads);
    if (list.length === 0) return null;
    return (
      <div className="mt-2 space-y-2">
        {list.map((u) => (
          <div
            key={u.id}
            className="animate-in fade-in slide-in-from-top-1 rounded-md border border-white/10 bg-white/5 p-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-white/10">
                {[".png", ".jpg", ".jpeg"].includes(
                  (u.extension || "").toLowerCase(),
                ) && u.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.previewUrl}
                    alt={u.fileName}
                    className="h-10 w-10 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="text-white/70">{iconForExt(u.extension)}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-xs text-white/90"
                  title={u.fileName}
                >
                  {u.fileName}
                </div>
                <div className="text-[10px] text-white/50">
                  {formatSize(u.fileSize)} •{" "}
                  {u.status === "success" ? (
                    <span className="text-emerald-400">Loaded</span>
                  ) : u.status === "error" ? (
                    <span className="text-red-400">Error</span>
                  ) : (
                    <span className="text-white/70">Processing…</span>
                  )}
                </div>
                {u.status === "uploading" && (
                  <div className="mt-1">
                    <Progress value={u.progress} />
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {u.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : u.status === "error" ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  switch (type) {

    case "radio":
      return (
        <div className="flex flex-wrap gap-2">
          {(item.options || []).map((opt: string) => (
            <Button
              key={opt}
              type="button"
              variant={value === opt ? "default" : "outline"}
              className="h-8 px-3"
              onClick={() => onChange(opt)}
              disabled={disabled}
            >
              {opt}
            </Button>
          ))}
        </div>
      );
    case "text":
    case "percent":
      return (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value"
          className="text-white"
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="text-white"
        />
      );
    case "dropdown":
      return (
        <select
          className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Select
          </option>
          {(item.options || []).map((o: string) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "multi-select":
      return (
        <div className="flex flex-wrap gap-2">
          {(item.options || []).map((opt: string) => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <Button
                key={opt}
                type="button"
                variant={selected ? "default" : "outline"}
                className="h-8 px-3"
                onClick={() => {
                  let next = Array.isArray(value) ? [...value] : [];
                  if (selected) next = next.filter((v) => v !== opt);
                  else next.push(opt);
                  onChange(next);
                }}
              >
                {opt}
              </Button>
            );
          })}
        </div>
      );
    case "document":
      return (
        <div className="space-y-3">
          {Array.isArray(item.subInputs) && item.subInputs.length > 0 && (
            <div className="space-y-2">
              {item.subInputs.map((si: any) => (
                <div key={si.label} className="flex items-center gap-3">
                  <div className="min-w-48 text-sm text-white/80">
                    {si.label}
                  </div>
                  <select
                    className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-white"
                    value={value?.[si.label] ?? ""}
                    onChange={(e) =>
                      onChange({ ...(value ?? {}), [si.label]: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {(si.options || []).map((o: string) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={typeof value === "string" ? value : value?.__text || ""}
              onChange={(e) =>
                onChange(
                  typeof value === "object" && value !== null
                    ? { ...(value ?? {}), __text: e.target.value }
                    : e.target.value,
                )
              }
              className="min-h-28 w-full rounded-md border border-white/10 bg-black/40 p-2 text-white"
              placeholder="Enter details"
            />
            <div className="sm:w-60">
              <UploadInline
                sectionKey={String(sectionKey)}
                groupKey={groupKey}
                itemId={String(item.id)}
                itemQuestion={String(item.question || "")}
                buttonLabel="Upload supporting docs"
              />
            </div>
          </div>
        </div>
      );
    case "table":
      return <SimpleTableEditor rows={value} onChange={onChange} />;
    default:
      // Check for generic table flag as fallback
      if (item.table === true) {
        return <SimpleTableEditor rows={value} onChange={onChange} />;
      }
      return (
        <div className="text-white/60">
          Unsupported field type: {String(type)}
        </div>
      );
  }
}

function DocumentsPanel({ currentCategory }: { currentCategory: string }) {
  const [docs, setDocs] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await (window as any).documents.list();
      setDocs(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const off = (window as any).documents.onProgress((p: any) => {
      if (p?.status === "success") load();
    });
    return () => off && off();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => {
      return (
        d.fileName.toLowerCase().includes(q) ||
        (d.contextLabel || "").toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    });
  }, [docs, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocumentMetadata[]>();
    for (const d of filtered) {
      const arr = map.get(d.category) || [];
      arr.push(d);
      map.set(d.category, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const iconFor = (ext: string) => {
    const e = (ext || "").toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(e))
      return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const filePreview = (doc: DocumentMetadata) => {
    const e = (doc.extension || "").toLowerCase();
    if ([".png", ".jpg", ".jpeg"].includes(e)) {
      const src = `file://${doc.thumbnailPath || ""}`;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={doc.fileName}
          className="h-9 w-9 rounded object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      );
    }
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded bg-white/10 text-white/70">
        {iconFor(doc.extension)}
      </div>
    );
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString();
  const formatSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let u = 0;
    while (size > 1024 && u < units.length - 1) {
      size /= 1024;
      u++;
    }
    return `${size.toFixed(1)} ${units[u]}`;
  };

  const handleDelete = async (id: string) => {
    const res = await (window as any).documents.delete(id);
    if (res?.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
  };
  const handleOpen = async (id: string) => {
    await (window as any).documents.open(id);
  };
  const handleDownload = async (id: string) => {
    await (window as any).documents.download(id);
  };

  const handleUploadPick = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    try {
      const acc = await (window as any).documents.acceptedTypes();
      input.accept = Array.isArray(acc) ? acc.join(",") : "";
    } catch {}
    input.onchange = async () => {
      const files = (input.files || []) as unknown as FileList;
      const paths: string[] = [];
      for (const f of Array.from(files)) {
        const fwp = f as unknown as { path?: string };
        if (fwp.path) paths.push(fwp.path);
      }
      if (paths.length) {
        await (window as any).documents.upload(paths, currentCategory);
        await load();
      }
    };
    input.click();
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-white">Documents</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white"
          onClick={handleUploadPick}
        >
          Upload to "{currentCategory}"
        </Button>
      </div>
      <Input
        placeholder="Search documents"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 text-white"
      />
      {loading ? (
        <div className="py-6 text-center text-white/60">Loading…</div>
      ) : grouped.length === 0 ? (
        <div className="py-6 text-center text-white/60">No documents yet.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([cat, list]) => (
            <div key={cat}>
              <div className="mb-2 text-xs font-semibold tracking-wide text-white/60 uppercase">
                {cat}
              </div>
              <ul className="space-y-2">
                {list
                  .slice()
                  .sort((a, b) => b.uploadTimestamp - a.uploadTimestamp)
                  .map((doc) => (
                    <li
                      key={doc.id}
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {filePreview(doc)}
                        <div className="min-w-0">
                          <button
                            className="truncate text-left text-sm font-medium text-white hover:underline"
                            onClick={() => handleOpen(doc.id)}
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </button>
                          <div className="truncate text-xs text-white/50">
                            {doc.contextLabel ? `${doc.contextLabel} • ` : ""}
                            {formatDate(doc.uploadTimestamp)} •{" "}
                            {formatSize(doc.fileSize)}
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="rounded border border-white/10 p-1 text-white/70 hover:bg-white/10 hover:text-white"
                          title="Open"
                          onClick={() => handleOpen(doc.id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded border border-white/10 p-1 text-white/70 hover:bg-white/10 hover:text-white"
                          title="Download"
                          onClick={() => handleDownload(doc.id)}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded border border-white/10 p-1 text-red-400 hover:bg-white/10"
                          title="Delete"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanningSection({ sectionKey, title }: PlanningSectionProps) {
  const companyName = getCompanyName();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<JsonValue | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (window as any).planning
      .readSection(companyName, sectionKey)
      .then((json: any) => {
        if (mounted) {
          setContent(json);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [companyName, sectionKey]);

  const tabs = useMemo(
    () => getTopLevelTabsForContent(content || {}),
    [content],
  );
  useEffect(() => {
    if (tabs.length && !activeTab) setActiveTab(tabs[0].key);
  }, [tabs, activeTab]);

  const flattenItems = useCallback((items: any[]): any[] => {
    const out: any[] = [];
    for (const it of items) {
      if (it && typeof it === "object") {
        if (Array.isArray(it.questions)) {
          out.push(...flattenItems(it.questions));
        } else if (it.id) {
          out.push(it);
        }
      }
    }
    return out;
  }, []);

  const isValuePresent = (val: any): boolean => {
    if (val === null || typeof val === "undefined") return false;
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "object") return Object.keys(val).length > 0;
    return true;
  };

  const computeTabProgress = useCallback(
    (tabKey: string) => {
      const tab = tabs.find((t) => t.key === tabKey);
      const items = flattenItems(tab?.items || []);
      const total = items.length;
      const answered = items.filter((it) => isValuePresent(it.answer)).length;
      return { total, answered, items };
    },
    [tabs, flattenItems],
  );

  const scrollToQuestion = (id: string) => {
    const el = questionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  function updateInArray(
    arr: any[],
    targetId: string,
    mutate: (el: any) => { el: any; matched: boolean },
  ): { nextArr: any[]; found: boolean } {
    let found = false;
    const nextArr = arr.map((el) => {
      if (el && typeof el === "object") {
        if (el.id === targetId) {
          const res = mutate(el);
          if (res.matched) found = true;
          return res.el;
        }
        if (Array.isArray(el.questions)) {
          const { nextArr: qNext, found: qFound } = updateInArray(
            el.questions,
            targetId,
            mutate,
          );
          if (qFound) {
            found = true;
            return { ...el, questions: qNext };
          }
        }
      }
      return el;
    });
    return { nextArr, found };
  }

  const setItemField = (
    groupKey: string,
    itemId: string,
    fieldName: string,
    nextValue: any,
    mergeObject = false,
  ) => {
    setContent((prev: JsonValue | null) => {
      if (!prev) return prev;
      const rootKey = Object.keys(prev)[0];
      const root = prev[rootKey];
      const next = { ...prev } as any;
      if (Array.isArray(root)) {
        const { nextArr } = updateInArray(root as any[], itemId, (el) => {
          const updated = mergeObject
            ? { ...el, [fieldName]: { ...(el[fieldName] || {}), ...nextValue } }
            : { ...el, [fieldName]: nextValue };
          return { el: updated, matched: true };
        });
        next[rootKey] = nextArr;
      } else {
        const groups = { ...(root as any) };
        const arr = Array.isArray(groups[groupKey]) ? groups[groupKey] : [];
        const { nextArr } = updateInArray(arr, itemId, (el) => {
          const updated = mergeObject
            ? { ...el, [fieldName]: { ...(el[fieldName] || {}), ...nextValue } }
            : { ...el, [fieldName]: nextValue };
          return { el: updated, matched: true };
        });
        groups[groupKey] = nextArr;
        next[rootKey] = groups;
      }
      // Autosave
      (window as any).planning
        .saveSection(companyName, sectionKey, next)
        .then(() => setLastSaved(new Date()));
      return next;
    });
  };

  const setItemAnswer = (groupKey: string, itemId: string, nextValue: any) =>
    setItemField(groupKey, itemId, "answer", nextValue);

  function buildAnswersMap(items: any[]): Record<string, any> {
    const map: Record<string, any> = {};
    const walk = (arr: any[]) => {
      for (const el of arr) {
        if (el && typeof el === "object") {
          if (el.id) map[el.id] = el.answer;
          if (Array.isArray(el.questions)) walk(el.questions);
        }
      }
    };
    walk(items);
    return map;
  }

  function evalCondition(cond: any, answers: Record<string, any>): boolean {
    if (!cond) return true;
    const { questionId, operator, value } = cond;
    const actual = answers[questionId];
    switch (operator) {
      case "==":
      default:
        return actual === value;
    }
  }

  function evalConditions(
    conds: any[] | undefined,
    answers: Record<string, any>,
  ): boolean {
    if (!conds || conds.length === 0) return true;
    return conds.every((c) => evalCondition(c, answers));
  }

  if (loading) {
    return <div className="text-white/70">Loading {title}…</div>;
  }
  if (!content) {
    return <div className="text-white/70">No content</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {lastSaved && (
          <Badge className="bg-emerald-500/15 text-emerald-300">
            Saved {lastSaved.toLocaleTimeString()}
          </Badge>
        )}
      </div>
      <Card className="border-white/10 bg-black/30 text-white">
        <CardHeader className="sticky top-0 z-10 bg-black/30 backdrop-blur">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {Object.keys(content || {})[0]}
            </CardTitle>
            {activeTab &&
              (() => {
                const p = computeTabProgress(activeTab);
                const percent = p.total
                  ? Math.round((p.answered / p.total) * 100)
                  : 0;
                return (
                  <div className="text-xs text-white/70">
                    {p.answered}/{p.total} ({percent}%)
                  </div>
                );
              })()}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList>
              {tabs.map((t) => {
                const p = computeTabProgress(t.key);
                return (
                  <TabsTrigger key={t.key} value={t.key} className="gap-2">
                    <span>{t.title}</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                      {p.answered}/{p.total}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {tabs.map((t) => {
              const answersMap = buildAnswersMap(t.items || []);
              const renderItems = (items: any[]): React.ReactNode =>
                items.map((item: any) => {
                  // Group-level conditional wrapper
                  if (
                    item &&
                    typeof item === "object" &&
                    item.condition &&
                    Array.isArray(item.questions)
                  ) {
                    if (!evalCondition(item.condition, answersMap)) return null;
                    return (
                      <React.Fragment key={`cond-${Math.random()}`}>
                        {renderItems(item.questions)}
                      </React.Fragment>
                    );
                  }
                  if (
                    item &&
                    typeof item === "object" &&
                    Array.isArray(item.conditions)
                  ) {
                    if (!evalConditions(item.conditions, answersMap))
                      return null;
                  }
                  if (
                    item &&
                    typeof item === "object" &&
                    item.condition &&
                    !item.questions
                  ) {
                    if (!evalCondition(item.condition, answersMap)) return null;
                  }

                  const drqIf = item.documentRequiredIf;
                  let requiredNote = Boolean(item.documentRequired);
                  if (Array.isArray(drqIf)) {
                    requiredNote = requiredNote || drqIf.includes(item.answer);
                  } else if (typeof drqIf !== "undefined") {
                    requiredNote = requiredNote || item.answer === drqIf;
                  }

                  const noteIf =
                    item.noteIf && item.answer && item.noteIf[item.answer];

                  // Sub-question logic
                  let subQuestion: any | null = null;
                  if (
                    item.subQuestionIf &&
                    item.answer &&
                    item.subQuestionIf[item.answer]
                  ) {
                    subQuestion = {
                      ...item.subQuestionIf[item.answer],
                      parentId: item.id,
                    };
                  }
                  const showDynTable = (() => {
                    const dt = item.dynamicTableIf;
                    if (!dt) return false;
                    if (typeof dt === "string") return item.answer === dt;
                    if (typeof dt === "object") return Boolean(dt[item.answer]);
                    return false;
                  })();
                  const showTableIf = (() => {
                    const ti = item.tableif;
                    if (!ti) return false;
                    if (typeof ti === "string") return item.answer === ti;
                    if (typeof ti === "object") return Boolean(ti[item.answer]);
                    return false;
                  })();

                  const matchesSearch = (txt: string) =>
                    txt.toLowerCase().includes(searchQuery.toLowerCase());
                  const isAnswered = isValuePresent(item.answer);
                  const visibleBySearch =
                    !searchQuery ||
                    matchesSearch(String(item.question || item.id || ""));
                  const visibleByFilter = !onlyUnanswered || !isAnswered;
                  if (!visibleBySearch || !visibleByFilter) return null;

                  return (
                    <div
                      key={item.id ?? item.head ?? Math.random()}
                      ref={(el) => {
                        if (item.id) questionRefs.current[item.id] = el;
                      }}
                      className="rounded-lg border border-white/10 bg-black/20 p-4"
                    >
                      {item.head ? (
                        <div className="mb-1 text-sm text-white/70">
                          {item.head}
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 text-sm font-medium text-white">
                            {item.question || item.id}
                          </div>
                          {requiredNote && (
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-amber-300">
                                Documentation required
                              </span>
                              {item.type !== "document" && (
                                <UploadInline
                                  sectionKey={String(sectionKey)}
                                  groupKey={t.key}
                                  itemId={String(item.id)}
                                  itemQuestion={String(item.question || "")}
                                  buttonLabel="Attach documents"
                                  compact
                                />
                              )}
                            </div>
                          )}
                          {noteIf && (
                            <div className="mb-2 text-xs text-white/70">
                              {noteIf}
                            </div>
                          )}
                          <FieldRenderer
                            item={item}
                            value={item.answer}
                            onChange={(val) =>
                              setItemAnswer(t.key, item.id, val)
                            }
                            sectionKey={sectionKey}
                            groupKey={t.key}
                          />
                          {/* Indicators are already shown by UploadInline */}
                          {subQuestion && (
                            <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-3">
                              <div className="mb-2 text-xs font-medium text-white/80">
                                {subQuestion.question}
                              </div>
                              <FieldRenderer
                                item={subQuestion}
                                value={item.subAnswers?.[subQuestion.id]}
                                onChange={(val) =>
                                  setItemField(
                                    t.key,
                                    item.id,
                                    "subAnswers",
                                    { [subQuestion.id]: val },
                                    true,
                                  )
                                }
                                sectionKey={sectionKey}
                                groupKey={t.key}
                              />
                              {subQuestion.tableif &&
                                ((typeof subQuestion.tableif === "string" &&
                                  item.subAnswers?.[subQuestion.id] ===
                                    subQuestion.tableif) ||
                                  (typeof subQuestion.tableif === "object" &&
                                    subQuestion.tableif[
                                      item.subAnswers?.[subQuestion.id]
                                    ])) && (
                                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
                                    <div className="mb-2 text-xs font-medium text-white/80">
                                      Details
                                    </div>
                                    <SimpleTableEditor
                                      rows={
                                        item.subAnswers?.[
                                          `${subQuestion.id}__table`
                                        ]
                                      }
                                      onChange={(val) =>
                                        setItemField(
                                          t.key,
                                          item.id,
                                          "subAnswers",
                                          { [`${subQuestion.id}__table`]: val },
                                          true,
                                        )
                                      }
                                    />
                                  </div>
                                )}
                            </div>
                          )}
                          {(showDynTable || showTableIf) && (
                            <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-3">
                              <div className="mb-2 text-xs font-medium text-white/80">
                                Details
                              </div>
                              <SimpleTableEditor
                                rows={item.details}
                                onChange={(val) =>
                                  setItemField(t.key, item.id, "details", val)
                                }
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                });

              const p = computeTabProgress(t.key);
              return (
                <TabsContent key={t.key} value={t.key} className="mt-4">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {renderItems(t.items || [])}
                    </div>
                    <div className="space-y-3">
                      <DocumentsPanel currentCategory={String(sectionKey)} />
                      <div className="mt-2 text-right text-[10px] text-white/60">
                        {p.answered}/{p.total} completed
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

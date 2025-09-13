"use client";

import React, { useEffect, useMemo, useState } from "react";
import DocumentUploader from "./DocumentUploader";
import { FileText, Image, Trash2, ExternalLink } from "lucide-react";

type Doc = Window["documents"] extends { list: () => Promise<infer T> }
  ? T extends Array<infer U>
    ? U
    : never
  : any;

const ALL_CATEGORIES = [
  // Financial sections
  "overview",
  "financial-ratios",
  "balance-sheet",
  "trial-balance",
  "profit-loss",
  "charts",
  // Planning sections
  "engagement-acceptance",
  "fraud-risk",
  "it-risk",
  "materiality",
  "preliminary-analytical",
  "understanding-entity",
  // Generic
  "general",
] as const;

export default function DocumentsPage() {
  const [category, setCategory] =
    useState<(typeof ALL_CATEGORIES)[number]>("general");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await window.documents.list();
      setDocs(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      docs.filter((d) =>
        category === "general" ? true : d.category === category,
      ),
    [docs, category],
  );

  const iconFor = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === ".png" || e === ".jpg" || e === ".jpeg")
      return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const filePreview = (doc: Doc) => {
    const e = doc.extension.toLowerCase();
    if (e === ".png" || e === ".jpg" || e === ".jpeg") {
      const src = `file://${doc.thumbnailPath || ""}`;
      return (
        <img
          src={src}
          alt={doc.fileName}
          className="h-24 w-full rounded object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      );
    }
    return (
      <div className="flex h-24 w-full items-center justify-center rounded bg-white/10 text-white/70">
        {iconFor(doc.extension)}
      </div>
    );
  };

  const handleDelete = async (id: string) => {
    const res = await window.documents.delete(id);
    if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleOpen = async (id: string) => {
    await window.documents.open(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Documents</h2>
          <p className="text-sm text-white/60">
            Upload and manage supporting documents. Choose a context to
            associate uploads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-white/70">Context</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-sm text-white"
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DocumentUploader sectionKey={category} />

      <div>
        <div className="mb-3 text-sm font-medium text-white">
          Recent in {category}
        </div>
        {loading ? (
          <div className="text-white/60">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-white/50">No documents.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="group overflow-hidden rounded-lg border border-white/10 bg-white/5"
              >
                {filePreview(doc)}
                <div className="flex items-center justify-between p-2">
                  <div className="min-w-0">
                    <div
                      className="truncate text-xs text-white/80"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </div>
                    <div className="text-[10px] text-white/50">
                      {doc.category}
                      {doc.contextLabel ? ` • ${doc.contextLabel}` : ""}
                      {doc.contextId ? ` (#${doc.contextId})` : ""} •{" "}
                      {new Date(doc.uploadTimestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                      title="Open"
                      onClick={() => handleOpen(doc.id)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                      title="Delete"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, FileText, Image, Trash2 } from "lucide-react";

type DocumentMetadata = import("../../types").DocumentMetadata;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentSidebar({ isOpen, onClose }: Props) {
  const [docs, setDocs] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await window.documents.list();
      setDocs(list.sort((a, b) => b.uploadTimestamp - a.uploadTimestamp));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      load();
    }
  }, [isOpen]);

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

  const iconFor = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === ".png" || e === ".jpg" || e === ".jpeg")
      return <Image className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleDelete = async (id: string) => {
    const res = await window.documents.delete(id);
    if (res.ok) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleDownload = async (id: string) => {
    await window.documents.download(id);
  };

  const handleOpen = async (id: string) => {
    await window.documents.open(id);
  };

  return (
    <div
      className={`pointer-events-none fixed top-0 right-0 z-40 h-full w-96 transform bg-black/70 text-white shadow-2xl backdrop-blur-md transition-transform duration-300 ${
        isOpen ? "pointer-events-auto translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="text-sm font-semibold">Documents</h3>
        <button
          className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="flex h-[calc(100%-48px)] flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-white/60">
            Loading...
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-3">
            {docs.length === 0 ? (
              <div className="mt-10 text-center text-white/50">
                No documents uploaded yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-white/10 text-white/80">
                        {iconFor(doc.extension)}
                      </div>
                      <div className="min-w-0">
                        <button
                          className="truncate text-left text-sm font-medium text-white hover:underline"
                          onClick={() => handleOpen(doc.id)}
                          title={doc.fileName}
                        >
                          {doc.fileName}
                        </button>
                        <div className="truncate text-xs text-white/50">
                          {doc.category}
                          {doc.contextLabel ? ` • ${doc.contextLabel}` : ""}
                          {doc.contextId ? ` (#${doc.contextId})` : ""} •{" "}
                          {formatDate(doc.uploadTimestamp)} •{" "}
                          {formatSize(doc.fileSize)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        className="rounded p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        title="Download"
                        onClick={() => handleDownload(doc.id)}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        title="Delete"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

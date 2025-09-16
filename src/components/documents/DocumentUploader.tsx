"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloudUpload, File, Image, Loader2, Link } from "lucide-react";
import { CloudFilePicker } from "../ui/cloud-file-picker";
import { CloudFileEntry } from "../../helpers/ipc/cloud/cloud-context";

type ProgressMap = Record<
  string,
  {
    progress: number;
    status: "uploading" | "success" | "error";
    error?: string;
  }
>;

interface Props {
  sectionKey: string;
  context?: { contextId?: string; contextLabel?: string; groupKey?: string };
}

export default function DocumentUploader({ sectionKey, context }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [acceptedExts, setAcceptedExts] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [lastUploads, setLastUploads] = useState<string[]>([]);

  const handleCloudFileSelect = useCallback(async (file: CloudFileEntry) => {
    // For cloud files, we just log the selection and add to lastUploads
    console.log(`Cloud file linked: ${file.name} for section ${sectionKey}`);
    setLastUploads(prev => [...prev, `cloud-${file.name}`]);
  }, [sectionKey]);

  const handleLocalFilesFromPicker = useCallback(async (files: File[]) => {
    // Convert File[] to paths and handle like regular upload
    const paths: string[] = [];
    for (const file of files) {
      // @ts-expect-error electron adds .path
      if (file.path) paths.push(file.path);
    }
    if (paths.length > 0) {
      const res = await window.documents.upload(paths, sectionKey, context);
      const okIds = res
        .filter((r) => r.ok && r.document)
        .map((r) => r.document!.id);
      setLastUploads(okIds);
    }
  }, [sectionKey, context]);

  useEffect(() => {
    window.documents.acceptedTypes().then(setAcceptedExts);
    const off = window.documents.onProgress(
      ({ id, progress, status, error }) => {
        setProgress((prev) => ({ ...prev, [id]: { progress, status, error } }));
      },
    );
    return () => off();
  }, []);

  const acceptAttr = useMemo(() => acceptedExts.join(","), [acceptedExts]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const paths: string[] = [];
      for (const f of Array.from(fileList)) {
        // @ts-expect-error electron provides path on File
        if (f.path) paths.push(f.path as string);
      }
      if (paths.length === 0) return;
      const res = await window.documents.upload(paths, sectionKey, context);
      const okIds = res
        .filter((r) => r.ok && r.document)
        .map((r) => r.document!.id);
      setLastUploads(okIds);
    },
    [sectionKey, context],
  );

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    await handleFiles(files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files);
    e.currentTarget.value = "";
  };

  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-6 text-white">
      <div
        className={`relative flex min-h-[180px] flex-col items-center justify-center rounded-lg p-6 transition-colors ${
          dragActive ? "bg-white/10" : "bg-transparent"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <CloudUpload className="mb-3 h-10 w-10 text-white/60" />
        <p className="text-sm text-white/80">Drag & drop files here</p>
        <p className="mb-3 text-xs text-white/50">or</p>
        
        <div className="flex gap-2">
          <label className="cursor-pointer rounded bg-white/10 px-3 py-2 text-xs hover:bg-white/20">
            Choose files
            <input
              type="file"
              multiple
              accept={acceptAttr}
              className="hidden"
              onChange={onInputChange}
            />
          </label>
          
          <CloudFilePicker
            onFileSelected={handleCloudFileSelect}
            onLocalFileSelected={handleLocalFilesFromPicker}
            multiple={true}
            triggerText="Link Cloud File"
            className="rounded bg-blue-500/20 px-3 py-2 text-xs hover:bg-blue-500/30 border-none text-white"
          />
        </div>
        
        <div className="mt-3 text-xs text-white/50">
          Accepted: {acceptedExts.join(", ")}
        </div>
      </div>

      {Object.keys(progress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(progress).map(([id, p]) => (
            <div
              key={id}
              className="rounded border border-white/10 bg-black/30 p-2"
            >
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Upload {id.slice(0, 8)}</span>
                <span>{p.progress}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                <div
                  className={`h-2 transition-all ${p.status === "error" ? "bg-red-500" : "bg-[#4da3ff]"}`}
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              {p.status === "error" && (
                <div className="mt-1 text-xs text-red-400">
                  {p.error || "Upload failed"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

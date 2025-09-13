import React, { createContext, useContext, useMemo, useState } from "react";

export type PayrollDocument = {
  id: string;
  filePath: string;
  fileName: string;
  extension: string;
  addedAt: number;
  fileSize?: number;
};

type PayrollDocumentsContextValue = {
  documents: PayrollDocument[];
  addDocumentsByPaths: (paths: string[]) => void;
  removeDocument: (id: string) => void;
};

const PayrollDocumentsContext = createContext<
  PayrollDocumentsContextValue | undefined
>(undefined);

export function usePayrollDocuments(): PayrollDocumentsContextValue {
  const ctx = useContext(PayrollDocumentsContext);
  if (!ctx)
    throw new Error(
      "usePayrollDocuments must be used within PayrollDocumentsProvider",
    );
  return ctx;
}

export function PayrollDocumentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [documents, setDocuments] = useState<PayrollDocument[]>([]);

  const addDocumentsByPaths = (paths: string[]) => {
    if (!paths || paths.length === 0) return;
    setDocuments((prev) => {
      const existingPaths = new Set(prev.map((d) => d.filePath));
      const next: PayrollDocument[] = [...prev];
      for (const p of paths) {
        if (existingPaths.has(p)) continue;
        const ext = extractExtension(p);
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          filePath: p,
          fileName: extractFileName(p),
          extension: ext,
          addedAt: Date.now(),
        });
      }
      return next;
    });
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const value = useMemo(
    () => ({ documents, addDocumentsByPaths, removeDocument }),
    [documents],
  );

  return (
    <PayrollDocumentsContext.Provider value={value}>
      {children}
    </PayrollDocumentsContext.Provider>
  );
}

function extractFileName(fullPath: string): string {
  const parts = fullPath.split(/[/\\\\]/);
  return parts[parts.length - 1] || fullPath;
}

function extractExtension(fullPath: string): string {
  const idx = fullPath.lastIndexOf(".");
  return idx >= 0 ? fullPath.slice(idx).toLowerCase() : "";
}

export function isPreviewableImage(ext: string): boolean {
  return [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext.toLowerCase());
}

export function toFileUrl(p: string): string {
  if (!p) return "";
  if (p.startsWith("file://")) return p;
  return `file://${p}`;
}

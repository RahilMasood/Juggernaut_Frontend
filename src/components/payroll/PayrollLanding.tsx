import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShieldCheck, Layers, Lock, FileCheck2, Link } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  usePayrollDocuments,
  isPreviewableImage,
  toFileUrl,
} from "./PayrollDocumentsContext";
import { SharePointFileUpload } from "../ui/sharepoint-file-upload";
import { CloudFileEntry } from "../../helpers/ipc/cloud/cloud-context";

type PayrollLandingProps = {
  onSelect: (section: string) => void;
};

const categories: Array<{
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    id: "payroll-tailoring",
    title: "Tailoring Questions",
    description:
      "Customize the audit program with entity-specific questions and responses.",
    icon: Layers,
    accent: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "payroll-romms",
    title: "RoMMs",
    description:
      "Identify and assess risks of material misstatement relevant to payroll.",
    icon: ShieldCheck,
    accent: "from-amber-500/20 to-orange-500/20",
  },
  {
    id: "payroll-controls",
    title: "Internal Controls",
    description:
      "Evaluate design and implementation of key payroll-related controls.",
    icon: Lock,
    accent: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "payroll-substantive",
    title: "Substantive Procedures",
    description:
      "Perform detailed procedures over payroll balances and transactions.",
    icon: FileCheck2,
    accent: "from-fuchsia-500/20 to-purple-500/20",
  },
];

export default function PayrollLanding({ onSelect }: PayrollLandingProps) {
  const { documents, addDocumentsByPaths, removeDocument } =
    usePayrollDocuments();
  const [accepted, setAccepted] = useState<string[]>([]);

  useEffect(() => {
    // Reuse documents.acceptedTypes for broad list
    try {
      const api = (window as any).documents;
      if (api && typeof api.acceptedTypes === 'function') {
        api.acceptedTypes().then(setAccepted).catch(() => setAccepted([]));
      } else {
        setAccepted([]);
      }
    } catch {
      setAccepted([]);
    }
  }, []);

  const acceptAttr = useMemo(() => accepted.join(","), [accepted]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const paths: string[] = [];
    for (const f of Array.from(files)) {
      // @ts-expect-error Electron File has .path
      if (f.path) paths.push(f.path);
    }
    if (paths.length > 0) addDocumentsByPaths(paths);
    e.currentTarget.value = "";
  };

  const pickFiles = async () => {
    try {
      // Trigger upload flow that also opens the dialog and uploads to cloud 'client'
      const res = await (window as any).payroll.uploadFile();
      if (res?.ok && Array.isArray(res.files) && res.files.length > 0) {
        const paths = res.files.map((f: any) => f.originalPath || f.savedPath).filter(Boolean);
        if (paths.length > 0) addDocumentsByPaths(paths);
        console.log(`✅ Uploaded ${res.files.length} file(s) to cloud 'client'`);
      } else if (res?.error) {
        console.error('❌ Upload failed:', res.error);
      } else {
        console.log('No files selected');
      }
    } catch (error) {
      console.error('❌ Error uploading files:', error);
    }
  };

  const handleSharePointFileUpload = (files: Array<{ name: string; path: string; cloudUrl?: string }>) => {
    console.log(`✅ Uploaded ${files.length} file(s) to SharePoint:`, files);
    // Add the uploaded files to the documents context
    const filePaths = files.map(f => f.path);
    addDocumentsByPaths(filePaths);
  };

  const handleLocalFilesFromPicker = (files: File[]) => {
    // Convert File[] to paths and add to documents
    const paths: string[] = [];
    for (const file of files) {
      // @ts-expect-error electron adds .path
      if (file.path) paths.push(file.path);
    }
    if (paths.length > 0) {
      addDocumentsByPaths(paths);
      console.log(`✅ Selected ${paths.length} file(s) from picker`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Employee Benefits Expense</h2>
          <p className="text-sm text-white/60">
            Choose a workflow to proceed. You can return here anytime.
          </p>
        </div>
        <Badge className="bg-white/10 text-white/80">Execution</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.id}
              className="group cursor-pointer border-white/10 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
              onClick={() => onSelect(cat.id)}
            >
              <CardContent className="p-4">
                <div
                  className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${cat.accent} p-2`}
                >
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
                <div className="mb-1 text-sm font-semibold">{cat.title}</div>
                <div className="mb-4 text-xs text-white/60">
                  {cat.description}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-xs text-white/80 group-hover:bg-white/10 group-hover:text-white"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Documents Uploader & Gallery */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-white">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Documents</div>
            <div className="text-xs text-white/60">
              Upload supporting documents. Only file paths are stored locally.
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              accept={acceptAttr}
              onChange={handleInput}
              className="hidden"
              id="payroll-docs-input"
            />

            <SharePointFileUpload
              onFilesUploaded={handleSharePointFileUpload}
              multiple={true}
              triggerText="Upload to SharePoint"
              className="h-8 px-3 text-xs border-white/10 bg-green-500/20 text-white hover:bg-green-500/30"
              showReferenceInput={true}
              referencePlaceholder="Enter reference name for files (optional)"
            />
          </div>
        </div>
        {documents.length === 0 ? (
          <div className="text-xs text-white/60">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group overflow-hidden rounded border border-white/10 bg-black/40"
              >
                <div className="relative">
                  {isPreviewableImage(doc.extension) ? (
                    <img
                      src={toFileUrl(doc.filePath)}
                      alt={doc.fileName}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-xs text-white/60">
                      {doc.extension.toUpperCase().replace(".", "") || "FILE"}
                    </div>
                  )}
                </div>
                <div className="border-t border-white/10 p-2">
                  <div className="truncate text-xs">{doc.fileName}</div>
                  <div className="truncate text-[10px] text-white/50">
                    {doc.filePath}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-[10px] text-white/70"
                      onClick={() => removeDocument(doc.id)}
                    >
                      Remove
                    </Button>
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

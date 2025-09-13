import React from "react";
import { Card, CardContent } from "../ui/card";
import {
  usePayrollDocuments,
  isPreviewableImage,
  toFileUrl,
} from "./PayrollDocumentsContext";

type PlaceholderProps = {
  title: string;
  blurb: string;
};

function Placeholder({ title, blurb }: PlaceholderProps) {
  const { documents } = usePayrollDocuments();
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-6">
          <h3 className="mb-2 text-lg font-semibold">{title}</h3>
          <p className="text-sm text-white/70">{blurb}</p>
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-4">
          <div className="mb-2 text-sm font-semibold">Linked Documents</div>
          {documents.length === 0 ? (
            <div className="text-xs text-white/60">
              No documents uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="overflow-hidden rounded border border-white/10 bg-black/40"
                >
                  {isPreviewableImage(doc.extension) ? (
                    <img
                      src={toFileUrl(doc.filePath)}
                      alt={doc.fileName}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center text-xs text-white/60">
                      {doc.extension.toUpperCase().replace(".", "") || "FILE"}
                    </div>
                  )}
                  <div className="truncate p-2 text-[10px] text-white/70">
                    {doc.fileName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TailoringQuestionsPanel() {
  return (
    <Placeholder
      title="Tailoring Questions"
      blurb="Placeholder: Dynamic tailoring questionnaire will appear here."
    />
  );
}

export function RommsPanel() {
  return (
    <Placeholder
      title="Risks of Material Misstatement (RoMMs)"
      blurb="Placeholder: Risk identification and assessment matrix."
    />
  );
}

export function ControlsPanel() {
  return (
    <Placeholder
      title="Internal Controls"
      blurb="Placeholder: Control design and implementation evaluation."
    />
  );
}

export function SubstantivePanel() {
  return (
    <Placeholder
      title="Substantive Procedures"
      blurb="Placeholder: Detailed procedures and sampling workbench."
    />
  );
}

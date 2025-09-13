import { LeftPanel } from "@/components/left-panel";
import { MainContent } from "@/components/main-content";
import { TopHeader } from "@/components/top-header";
import DocumentSidebar from "@/components/documents/DocumentSidebar";
import React, { useState } from "react";
import { PayrollDocumentsProvider } from "@/components/payroll/PayrollDocumentsContext";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("chat");
  const [docsOpen, setDocsOpen] = useState(false);

  return (
    <div className="bg-background flex h-screen flex-col">
      <TopHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onToggleDocuments={() => setDocsOpen((v) => !v)}
      />
      <div className="flex flex-1 overflow-hidden">
        <PayrollDocumentsProvider>
          <LeftPanel
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <MainContent
            activeSection={activeSection}
            searchTerm={searchTerm}
            setActiveSection={setActiveSection}
          />
        </PayrollDocumentsProvider>
      </div>
      <DocumentSidebar isOpen={docsOpen} onClose={() => setDocsOpen(false)} />
    </div>
  );
}

import { LeftPanel } from "@/components/left-panel";
import { MainContent } from "@/components/main-content";
import { TopHeader } from "@/components/top-header";
import FileUploadModal from "@/components/libraries/FileUploadModal";
import React, { useState } from "react";
import { PayrollDocumentsProvider } from "@/components/payroll/PayrollDocumentsContext";

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("chat");
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);

  return (
    <div className="bg-background flex h-screen flex-col">
      <TopHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onToggleLibraries={() => setActiveSection("libraries")}
        onAddFile={() => setIsFileUploadModalOpen(true)}
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
      
      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        onFileUploaded={(libraryId, fileName) => {
          console.log(`File ${fileName} uploaded to ${libraryId} library`);
          // Here you could trigger a refresh of the library content
        }}
      />
    </div>
  );
}

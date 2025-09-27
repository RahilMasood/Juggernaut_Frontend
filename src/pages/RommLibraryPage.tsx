import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Plus } from "lucide-react";
import { logger } from "@/utils/logger";

interface RommEntry {
  "romm-id": string;
  workspace: string;
  description: string;
  assertion: string;
  assesment: string;
  documentation: string;
  control_id: string[];
  procedure_id: string[];
}

interface RommLibrary {
  romm_library: RommEntry[];
}

export default function RommLibraryPage() {
  const [rommEntries, setRommEntries] = useState<RommEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRommData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      logger.info("Loading ROMM library data from SharePoint");
      
      if (window.sharePointAPI && window.sharePointAPI.readRommLibrary) {
        const result = await window.sharePointAPI.readRommLibrary();
        
        if (result.success && result.data) {
          const libraryData: RommLibrary = result.data;
          setRommEntries(libraryData.romm_library || []);
          logger.info("ROMM library data loaded successfully", { count: libraryData.romm_library?.length || 0 });
        } else {
          throw new Error(result.error || "Failed to load ROMM library data");
        }
      } else {
        throw new Error("SharePoint API not available");
      }
    } catch (error) {
      logger.error("Failed to load ROMM library data", { error });
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRommData();
  }, []);

  const handleAddNew = () => {
    // This would open the ROMM form dialog
    // For now, just show an alert
    alert("Add new ROMM entry functionality - this would open the form dialog");
  };

  const getAssertionColor = (assertion: string) => {
    const colors: { [key: string]: string } = {
      "Occurence": "bg-blue-500",
      "Classification": "bg-green-500",
      "Cutoff": "bg-yellow-500",
      "Accuracy": "bg-red-500",
      "Existence": "bg-purple-500",
      "Rights & Obligations": "bg-indigo-500",
      "Valuation": "bg-pink-500",
      "Completeness": "bg-orange-500",
    };
    return colors[assertion] || "bg-gray-500";
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">ROMM Library</h1>
            <p className="text-white/60">Risk of Material Misstatement entries from SharePoint</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadRommData}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleAddNew}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-white/60 mr-2" />
            <span className="text-white/60">Loading ROMM data from SharePoint...</span>
          </div>
        )}

        {error && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Error loading ROMM data</span>
              </div>
              <p className="text-red-300 mt-1">{error}</p>
              <Button
                onClick={loadRommData}
                variant="outline"
                size="sm"
                className="mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && rommEntries.length === 0 && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No ROMM entries found</h3>
              <p className="text-white/60 mb-4">No ROMM entries are available in the SharePoint library.</p>
              <Button
                onClick={handleAddNew}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && rommEntries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">
                ROMM Entries ({rommEntries.length})
              </h2>
            </div>
            
            <div className="grid gap-4">
              {rommEntries.map((entry, index) => (
                <Card key={index} className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">
                        {entry["romm-id"]}
                      </CardTitle>
                      <Badge className={`${getAssertionColor(entry.assertion)} text-white`}>
                        {entry.assertion}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-1">Workspace</h4>
                      <p className="text-white/60">{entry.workspace}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white/80 mb-1">Description</h4>
                      <p className="text-white/60">{entry.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { extractAnswersFromSection } from "@/utils/data-transforms";
import { handleAsync } from "@/utils/error-handling";
import { logger } from "@/utils/logger";

/**
 * Custom hook for managing materiality data state and operations.
 * Handles data loading, saving, and state management for the materiality assessment.
 */
export function useMaterialityData(companyName: string) {
  const [planningData, setPlanningData] = useState<any>(null);
  const [revisionData, setRevisionData] = useState<any>(null);
  const [abcotdData, setAbcotdData] = useState<any>(null);
  const [componentData, setComponentData] = useState<any>(null);
  const [documentationData, setDocumentationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("planning");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [crossSectionAnswers, setCrossSectionAnswers] = useState<Record<string, any>>({});

  // Load existing materiality data and cross-section answers
  useEffect(() => {
    const loadMaterialityData = async () => {
      try {
        const data = await (window as any).planning.readSection(
          companyName,
          "materiality",
        );
        if (data && data.planningData) {
          setPlanningData(data.planningData);
        }
        if (data && data.revisionData) {
          setRevisionData(data.revisionData);
        }
        if (data && data.abcotdData) {
          setAbcotdData(data.abcotdData);
        }
        if (data && data.componentData) {
          setComponentData(data.componentData);
        }
        if (data && data.documentationData) {
          setDocumentationData(data.documentationData);
        }
      } catch (error) {
        logger.warn("Failed to load materiality data", { error });
      }
    };

    const loadCrossSectionAnswers = async () => {
      try {
        const answers: Record<string, any> = {};

        // Load all potential cross-section dependencies
        const sectionsToLoad = [
          "engagement-acceptance",
          "understanding-entity",
          "fraud-risk",
          "it-risk",
          "preliminary-analytical",
        ];

        for (const section of sectionsToLoad) {
          try {
            const sectionData = await (window as any).planning.readSection(
              companyName,
              section,
            );

            // Extract answers from section data
            if (sectionData) {
              Object.assign(answers, extractAnswersFromSection(sectionData));
            }
          } catch (sectionError) {
            logger.warn(`Failed to load ${section} for cross-section answers`, {
              error: sectionError,
            });
          }
        }

        setCrossSectionAnswers(answers);
        logger.debug("Loaded cross-section answers", { answers });
      } catch (error) {
        logger.warn("Failed to load cross-section answers", { error });
      }
    };

    loadMaterialityData();
    loadCrossSectionAnswers();
  }, [companyName]);

  const handlePlanningDataChange = async (data: any) => {
    setPlanningData(data);
    await saveAllData({
      planningData: data,
      revisionData,
      abcotdData,
      componentData,
      documentationData,
    });
  };

  const handleRevisionComplete = () => {
    // Refresh data and switch back to planning tab
    setActiveTab("planning");
  };

  const handleAbcotdDataChange = async (data: any) => {
    setAbcotdData(data);
    await saveAllData({
      planningData,
      revisionData,
      abcotdData: data,
      componentData,
      documentationData,
    });
  };

  const handleComponentDataChange = async (data: any) => {
    setComponentData(data);
    await saveAllData({
      planningData,
      revisionData,
      abcotdData,
      componentData: data,
      documentationData,
    });
  };

  const handleDocumentationDataChange = async (data: any) => {
    setDocumentationData(data);
    await saveAllData({
      planningData,
      revisionData,
      abcotdData,
      componentData,
      documentationData: data,
    });
  };

  const saveAllData = async (materialityData: any) => {
    try {
      await (window as any).planning.saveSection(
        companyName,
        "materiality",
        materialityData,
      );
      setLastSaved(new Date());
    } catch (error) {
      logger.error("Failed to save materiality data", { error });
    }
  };

  const isPlanningComplete =
    planningData &&
    planningData.commonUsers &&
    planningData.selectedBenchmarks?.length > 0 &&
    planningData.determinedMateriality > 0;

  return {
    planningData,
    revisionData,
    abcotdData,
    componentData,
    documentationData,
    activeTab,
    lastSaved,
    crossSectionAnswers,
    handlePlanningDataChange,
    handleRevisionComplete,
    handleAbcotdDataChange,
    handleComponentDataChange,
    handleDocumentationDataChange,
    setActiveTab,
    isPlanningComplete,
  };
}

export const CONTROL_TEMPLATES = {
  manual: {
    sections: [
      {
        id: "control_summary",
        label: "Control Summary",
        panes: [
          {
            id: "control_details",
            label: "Control Details",
            fields: [
              {
                id: "control_id",
                label: "Control ID",
                type: "text"
              },
              {
                id: "control_name", 
                label: "Control Name",
                type: "text"
              },
              {
                id: "workspace",
                label: "Workspace",
                type: "multiSelectDropdown",
                options: ["Payroll", "Financial Reporting", "IT", "Operations", "Compliance"]
              },
              {
                id: "control_description",
                label: "Control Description",
                type: "richText"
              },
              {
                id: "control_attributes",
                label: "Control Attributes",
                fields: [
                  {
                    id: "type_of_control",
                    label: "Type of Control",
                    type: "dropdown",
                    options: ["Direct", "Indirect", "GITC"]
                  },
                  {
                    id: "nature",
                    label: "Nature",
                    type: "dropdown", 
                    options: ["Manual", "Automated", "Service Organization Control"]
                  },
                  {
                    id: "approach",
                    label: "Approach",
                    type: "dropdown",
                    options: ["Preventive", "Detective"]
                  },
                  {
                    id: "type",
                    label: "Type",
                    type: "multiSelectDropdown",
                    options: [
                      "Verification",
                      "Authorizations & Approvals", 
                      "Physical Controls & Counts",
                      "Controls over IUC",
                      "Reconciliations",
                      "Control with review element",
                      "GITC Control"
                    ]
                  }
                ]
              },
              {
                id: "tailoring_questions",
                label: "Tailoring Questions",
                fields: [
                  {
                    id: "test_operating_effectiveness",
                    label: "The engagement team is planning to test the operating effectiveness of the control",
                    type: "toggle"
                  },
                  {
                    id: "significant_risk",
                    label: "The control addresses a significant risk",
                    type: "toggle"
                  },
                  {
                    id: "review_element_estimate",
                    label: "The control includes a review element and addresses a significant accounting estimate",
                    type: "toggle"
                  }
                ]
              },
              {
                id: "related_accounts",
                label: "Related Accounts and Areas",
                fields: [
                  {
                    id: "romm_linkage",
                    label: "RoMM Linkage",
                    type: "multiSelectDropdown",
                    options: []
                  }
                ]
              },
              {
                id: "detailed_description",
                label: "Detailed Description",
                fields: [
                  {
                    id: "toggle_detailed",
                    label: "Show detailed description",
                    type: "toggle"
                  },
                  {
                    id: "steps",
                    label: "Control Steps",
                    type: "repeatableGroup",
                    fields: [
                      {
                        id: "step_description",
                        label: "Step Description",
                        type: "largeTextbox"
                      },
                      {
                        id: "iuc",
                        label: "IUC",
                        type: "text"
                      },
                      {
                        id: "output",
                        label: "Output",
                        type: "text"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "evaluate_design_and_implementation",
        label: "Evaluate Design and Implementation",
        panes: [
          {
            id: "design_implementation",
            label: "Design Implementation",
            fields: [
              {
                id: "procedure_steps",
                label: "Procedure Steps",
                type: "repeatableGroup",
                fields: [
                  {
                    id: "procedures_performed",
                    label: "Procedures Performed",
                    type: "largeTextbox"
                  },
                  {
                    id: "nature_of_testing",
                    label: "Nature of Testing",
                    type: "dropdown",
                    options: ["Inquiry + Observation", "Inquiry + Inspection", "Observation", "Inspection"]
                  },
                  {
                    id: "procedure_description",
                    label: "Procedure Description",
                    type: "largeTextbox"
                  },
                  {
                    id: "test_of_design",
                    label: "Test of Design",
                    type: "largeTextbox"
                  }
                ]
              }
            ]
          },
          {
            id: "evidence_design",
            label: "Evidence Design",
            fields: [
              {
                id: "evidence_document",
                label: "Evidence Document",
                type: "text"
              }
            ]
          },
          {
            id: "design_factors",
            label: "Design Factors",
            fields: [
              {
                id: "factor1",
                label: "Factor 1",
                type: "text"
              },
              {
                id: "factor2_owner",
                label: "Factor 2 - Owner",
                fields: [
                  {
                    id: "toggle",
                    label: "Toggle",
                    type: "toggle"
                  },
                  {
                    id: "association",
                    label: "Association",
                    type: "text"
                  }
                ]
              },
              {
                id: "factor3_frequency",
                label: "Factor 3 - Frequency",
                type: "text"
              },
              {
                id: "factor3_consistency",
                label: "Factor 3 - Consistency",
                type: "text"
              },
              {
                id: "factor4",
                label: "Factor 4",
                type: "text"
              },
              {
                id: "factor5",
                label: "Factor 5",
                type: "text"
              }
            ]
          },
          {
            id: "dependent_controls",
            label: "Dependent Controls",
            fields: [
              {
                id: "is_dependent",
                label: "Is Dependent",
                type: "dropdown",
                options: ["Yes", "No"]
              },
              {
                id: "associated_controls",
                label: "Associated Controls",
                type: "text"
              }
            ]
          },
          {
            id: "effectiveness_design",
            label: "Effectiveness Design",
            fields: [
              {
                id: "design_effective",
                label: "Design Effective",
                type: "dropdown",
                options: ["Yes", "No"]
              },
              {
                id: "implemented",
                label: "Implemented",
                type: "dropdown",
                options: ["Yes", "No"]
              }
            ]
          }
        ]
      },
      {
        id: "prior_year_audit_evidence",
        label: "Prior Year Audit Evidence",
        fields: [
          {
            id: "use_prior_year",
            label: "Use Prior Year",
            type: "dropdown",
            options: ["Yes", "No"]
          },
          {
            id: "changes_since_prior",
            label: "Changes Since Prior",
            type: "text"
          },
          {
            id: "significant_changes",
            label: "Significant Changes",
            type: "text"
          },
          {
            id: "tested_current_year",
            label: "Tested Current Year",
            type: "dropdown",
            options: ["Yes", "No"]
          },
          {
            id: "supporting_docs",
            label: "Supporting Documents",
            type: "text"
          }
        ]
      },
      {
        id: "risk_associated_with_control",
        label: "Risk Associated with Control",
        fields: [
          {
            id: "risk_level",
            label: "Risk Level",
            type: "dropdown",
            options: ["High", "Medium", "Low"]
          },
          {
            id: "risk_basis",
            label: "Risk Basis",
            type: "largeTextbox"
          }
        ]
      },
      {
        id: "operating_effectiveness",
        label: "Operating Effectiveness",
        fields: [
          {
            id: "timing_procedure",
            label: "Timing Procedure",
            type: "text"
          },
          {
            id: "extent_frequency",
            label: "Extent Frequency",
            type: "text"
          },
          {
            id: "deviations",
            label: "Deviations",
            type: "dropdown",
            options: ["Yes", "No"]
          },
          {
            id: "deviation_details",
            label: "Deviation Details",
            type: "largeTextbox"
          },
          {
            id: "sample_size",
            label: "Sample Size",
            type: "number"
          },
          {
            id: "sample_rationale",
            label: "Sample Rationale",
            type: "largeTextbox"
          },
          {
            id: "nature_procedures",
            label: "Nature Procedures",
            type: "repeatableGroup",
            fields: [
              {
                id: "nature",
                label: "Nature",
                type: "text"
              },
              {
                id: "procedure_description",
                label: "Procedure Description",
                type: "largeTextbox"
              }
            ]
          },
          {
            id: "operating_tests_docs",
            label: "Operating Tests Documents",
            type: "text"
          },
          {
            id: "operating_conclusion",
            label: "Operating Conclusion",
            type: "largeTextbox"
          }
        ]
      },
      {
        id: "rollforward",
        label: "Rollforward",
        fields: [
          {
            id: "rollforward_period",
            label: "Rollforward Period",
            fields: [
              {
                id: "start",
                label: "Start Date",
                type: "date"
              },
              {
                id: "end",
                label: "End Date",
                type: "date"
              }
            ]
          },
          {
            id: "inquiry_name",
            label: "Inquiry Name",
            type: "text"
          },
          {
            id: "inquiry_date",
            label: "Inquiry Date",
            type: "date"
          },
          {
            id: "changes_icfr",
            label: "Changes ICFR",
            type: "dropdown",
            options: ["Yes", "No"]
          },
          {
            id: "changes_details",
            label: "Changes Details",
            type: "largeTextbox"
          },
          {
            id: "additional_procedures",
            label: "Additional Procedures",
            type: "largeTextbox"
          },
          {
            id: "gitc_dependency",
            label: "GITC Dependency",
            type: "text"
          },
          {
            id: "rollforward_tests_docs",
            label: "Rollforward Tests Documents",
            type: "text"
          },
          {
            id: "rollforward_conclusion",
            label: "Rollforward Conclusion",
            type: "largeTextbox"
          }
        ]
      }
    ]
  },
  automated: {
    sections: [
      {
        id: "control_summary",
        label: "Control Summary",
        fields: [
          {
            id: "control_id",
            label: "Control ID",
            type: "text"
          },
          {
            id: "control_name",
            label: "Control Name", 
            type: "text"
          },
          {
            id: "workspace",
            label: "Workspace",
            type: "text"
          },
          {
            id: "control_description",
            label: "Control Description",
            type: "richText"
          },
          {
            id: "control_attributes",
            label: "Control Attributes",
            fields: [
              {
                id: "type_of_control",
                label: "Type of Control",
                type: "dropdown",
                options: ["Direct", "Indirect", "GITC"]
              },
              {
                id: "nature",
                label: "Nature",
                type: "dropdown",
                options: ["Manual", "Automated", "Service Organization Control"]
              },
              {
                id: "approach",
                label: "Approach",
                type: "dropdown",
                options: ["Preventive", "Detective"]
              },
              {
                id: "type",
                label: "Type",
                type: "multiSelectDropdown",
                options: [
                  "Verification",
                  "Authorizations & Approvals",
                  "Physical Controls & Counts", 
                  "Controls over IUC",
                  "Reconciliations",
                  "Control with review element",
                  "GITC Control"
                ]
              }
            ]
          },
          {
            id: "tailoring_questions",
            label: "Tailoring Questions",
            fields: [
              {
                id: "test_operating_effectiveness",
                label: "The engagement team is planning to test the operating effectiveness of the control",
                type: "toggle"
              }
            ]
          }
        ]
      },
      {
        id: "evaluate_design_and_implementation",
        label: "Evaluate Design and Implementation",
        fields: [
          {
            id: "display_control_description",
            label: "Display Control Description",
            type: "display"
          },
          {
            id: "associated_gitc",
            label: "Associated GITC",
            type: "text"
          },
          {
            id: "config_reliance",
            label: "Config Reliance",
            type: "text"
          },
          {
            id: "config_settings",
            label: "Config Settings",
            type: "repeatableGroup",
            fields: [
              {
                id: "setting_name",
                label: "Setting Name",
                type: "text"
              },
              {
                id: "setting_value",
                label: "Setting Value",
                type: "text"
              }
            ]
          },
          {
            id: "config_design",
            label: "Config Design",
            type: "largeTextbox"
          },
          {
            id: "config_access",
            label: "Config Access",
            type: "text"
          },
          {
            id: "config_change_frequency",
            label: "Config Change Frequency",
            type: "text"
          },
          {
            id: "procedures_design",
            label: "Procedures Design",
            type: "largeTextbox"
          },
          {
            id: "variants",
            label: "Variants",
            type: "repeatableGroup",
            fields: [
              {
                id: "variant_name",
                label: "Variant Name",
                type: "text"
              },
              {
                id: "variant_description",
                label: "Variant Description",
                type: "text"
              }
            ]
          },
          {
            id: "source_data",
            label: "Source Data",
            type: "repeatableGroup",
            fields: [
              {
                id: "source_name",
                label: "Source Name",
                type: "text"
              },
              {
                id: "source_description",
                label: "Source Description",
                type: "text"
              },
              {
                id: "gitc_applicable",
                label: "GITC Applicable",
                type: "dropdown",
                options: ["Yes", "No"]
              },
              {
                id: "business_control",
                label: "Business Control",
                type: "text"
              }
            ]
          },
          {
            id: "design_factors",
            label: "Design Factors",
            fields: [
              {
                id: "factor1",
                label: "Factor 1",
                type: "text"
              },
              {
                id: "factor2_owner",
                label: "Factor 2 - Owner",
                fields: [
                  {
                    id: "toggle",
                    label: "Toggle",
                    type: "toggle"
                  },
                  {
                    id: "association",
                    label: "Association",
                    type: "text"
                  }
                ]
              },
              {
                id: "factor3_frequency",
                label: "Factor 3 - Frequency",
                type: "text"
              },
              {
                id: "factor3_consistency",
                label: "Factor 3 - Consistency",
                type: "text"
              },
              {
                id: "factor4",
                label: "Factor 4",
                type: "text"
              },
              {
                id: "factor5",
                label: "Factor 5",
                type: "text"
              }
            ]
          },
          {
            id: "effectiveness_design",
            label: "Effectiveness Design",
            fields: [
              {
                id: "design_effective",
                label: "Design Effective",
                type: "dropdown",
                options: ["Yes", "No"]
              },
              {
                id: "implemented",
                label: "Implemented",
                type: "dropdown",
                options: ["Yes", "No"]
              }
            ]
          }
        ]
      },
      {
        id: "risk_associated_with_control",
        label: "Risk Associated with Control",
        fields: [
          {
            id: "risk_level",
            label: "Risk Level",
            type: "dropdown",
            options: ["High", "Medium", "Low"]
          },
          {
            id: "risk_basis",
            label: "Risk Basis",
            type: "largeTextbox"
          }
        ]
      },
      {
        id: "operating_effectiveness",
        label: "Operating Effectiveness",
        fields: [
          {
            id: "timing_procedure",
            label: "Timing Procedure",
            type: "text"
          },
          {
            id: "sample_size",
            label: "Sample Size",
            type: "number"
          },
          {
            id: "sample_rationale",
            label: "Sample Rationale",
            type: "largeTextbox"
          },
          {
            id: "using_work_of_others",
            label: "Using Work of Others",
            type: "dropdown",
            options: ["Yes", "No"]
          },
          {
            id: "work_of_others_approach",
            label: "Work of Others Approach",
            type: "text"
          },
          {
            id: "nature_procedures",
            label: "Nature Procedures",
            type: "repeatableGroup",
            fields: [
              {
                id: "nature",
                label: "Nature",
                type: "text"
              },
              {
                id: "procedure_description",
                label: "Procedure Description",
                type: "largeTextbox"
              },
              {
                id: "test_of_effectiveness",
                label: "Test of Effectiveness",
                type: "text"
              }
            ]
          },
          {
            id: "operating_tests_docs",
            label: "Operating Tests Documents",
            type: "text"
          },
          {
            id: "operating_conclusion",
            label: "Operating Conclusion",
            type: "largeTextbox"
          }
        ]
      },
      {
        id: "rollforward",
        label: "Rollforward",
        fields: [
          {
            id: "rollforward_period",
            label: "Rollforward Period",
            fields: [
              {
                id: "start",
                label: "Start Date",
                type: "date"
              },
              {
                id: "end",
                label: "End Date",
                type: "date"
              }
            ]
          },
          {
            id: "inquiry_name",
            label: "Inquiry Name",
            type: "text"
          },
          {
            id: "inquiry_date",
            label: "Inquiry Date",
            type: "date"
          },
          {
            id: "changes_icfr",
            label: "Changes ICFR",
            type: "dropdown",
            options: ["Yes", "No"]
          },
          {
            id: "changes_details",
            label: "Changes Details",
            type: "largeTextbox"
          },
          {
            id: "additional_procedures",
            label: "Additional Procedures",
            type: "largeTextbox"
          },
          {
            id: "gitc_dependency",
            label: "GITC Dependency",
            type: "text"
          },
          {
            id: "rollforward_tests_docs",
            label: "Rollforward Tests Documents",
            type: "text"
          },
          {
            id: "rollforward_conclusion",
            label: "Rollforward Conclusion",
            type: "largeTextbox"
          }
        ]
      }
    ]
  }
};


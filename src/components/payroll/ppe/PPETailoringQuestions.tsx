"use client";

import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";

interface PPETailoringQuestionsProps {
  onBack?: () => void;
}

interface TailoringQuestion {
  id: string;
  question: string;
  type: "radio";
  options: string[];
  DocumentRequiredIf?: string;
}

const TAILORING_QUESTIONS: TailoringQuestion[] = [
  {
    id: "PPE-1",
    question: "Does the entity use revaluation model of accounting for any of its classes of property, plant & equipment?",
    type: "radio",
    options: ["Yes", "No"],
    DocumentRequiredIf: "Yes"
  },
  {
    id: "PPE-2",
    question: "Has the entity capitalized any interest or salary on any asset during the year?",
    type: "radio",
    options: ["Yes", "No"]
  },
  {
    id: "PPE-3",
    question: "Are there any impairment indicators over the property, plant & equipment during the current year?",
    type: "radio",
    options: ["Yes", "No"]
  },
  {
    id: "PPE-4",
    question: "Does the entity have any self-generated asset/barter exchange during the period apart from capital work-in progress?",
    type: "radio",
    options: ["Yes", "No"]
  }
];

export default function PPETailoringQuestions({ onBack }: PPETailoringQuestionsProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));
  };

  const handleSave = () => {
    // Save responses logic here
    console.log("PPE Tailoring Questions responses:", responses);
    setIsCompleted(true);
  };

  const allQuestionsAnswered = () => {
    return TAILORING_QUESTIONS.every(q => responses[q.id]);
  };

  const getDocumentRequiredQuestions = () => {
    return TAILORING_QUESTIONS.filter(q => 
      q.DocumentRequiredIf && responses[q.id] === q.DocumentRequiredIf
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">PPE Tailoring Questions</h2>
          <p className="text-gray-400">Customize the audit program with entity-specific questions</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {TAILORING_QUESTIONS.map((question, index) => (
          <Card key={question.id} className="border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-400">
                  {index + 1}
                </span>
                <span className="text-lg">{question.question}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-white">Response</Label>
                <Select 
                  value={responses[question.id] || ""} 
                  onValueChange={(value) => handleResponseChange(question.id, value)}
                >
                  <SelectTrigger className="border-white/10 bg-black/40 text-white">
                    <SelectValue placeholder="Select your response" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-black/90 text-white">
                    {question.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {question.DocumentRequiredIf && responses[question.id] === question.DocumentRequiredIf && (
                  <div className="mt-2 flex items-center gap-2 text-amber-400">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Documentation required for this response</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Document Requirements Summary */}
      {getDocumentRequiredQuestions().length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-amber-400">
              <FileText className="h-5 w-5" />
              Documentation Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-amber-300 text-sm">
                The following questions require additional documentation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-200 text-sm">
                {getDocumentRequiredQuestions().map((q, index) => (
                  <li key={q.id}>
                    Question {TAILORING_QUESTIONS.findIndex(question => question.id === q.id) + 1}: {q.question}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={!allQuestionsAnswered()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isCompleted ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            "Save Responses"
          )}
        </Button>
      </div>
    </div>
  );
}

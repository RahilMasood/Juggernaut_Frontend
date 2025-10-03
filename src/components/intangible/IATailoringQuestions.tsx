"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft } from "lucide-react";

interface IATailoringQuestionsProps {
  onBack?: () => void;
}

type Question = {
  id: string;
  condition?: string;
  question: string;
  type: "radio";
  options: string[];
  DocumentRequiredIf?: string;
};

const QUESTIONS: Question[] = [
  {
    id: "INTAS-1",
    condition: "nl_check.py == true",
    question:
      "Have we confirmed that all intangible assets recognized by the entity satisfy the definition of intangible asset as per AS 26 – Intangible Assets, i.e., identifiable, non-monetary asset without physical substance held for use in the production or supply of goods or services, for rental to others, or for administrative purposes?",
    type: "radio",
    options: ["Yes", "No"],
    DocumentRequiredIf: "Yes",
  },
  {
    id: "INTAS-2",
    condition: "nl_check.py == true",
    question: "Has the entity capitalized any interest or salary on any asset during the year?",
    type: "radio",
    options: ["Yes", "No"],
  },
];

export default function IATailoringQuestions({ onBack }: IATailoringQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const setAnswer = (id: string, value: string) => setAnswers((p) => ({ ...p, [id]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Intangible Assets - Tailoring Questions</h2>
          <p className="text-gray-400">Answer entity-specific questions for Intangible Assets</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      </div>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-white">Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-2">
              <div className="text-white text-sm font-medium">{q.id}. {q.question}</div>
              <div className="flex gap-4 text-white/90 text-sm">
                {q.options.map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {q.DocumentRequiredIf && answers[q.id] === q.DocumentRequiredIf && (
                <div className="mt-2">
                  <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}






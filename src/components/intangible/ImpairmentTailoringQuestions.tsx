"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft } from "lucide-react";

interface ImpairmentTailoringQuestionsProps {
  onBack?: () => void;
}

type AnswerMap = Record<string, string>;

export default function ImpairmentTailoringQuestions({ onBack }: ImpairmentTailoringQuestionsProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const setAnswer = (id: string, value: string) => setAnswers((p) => ({ ...p, [id]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Impairment Testing - Tailoring Questions</h2>
          <p className="text-gray-400">Answer entity-specific questions for Impairment Testing</p>
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
          {/* Impt-4 */}
          <div className="space-y-2">
            <div className="text-white text-sm font-medium">Impt-4. Is there any significant degree of estimation uncertainty involved in any of the assumptions or methods?</div>
            <ul className="list-disc pl-6 text-white/70 text-xs">
              <li>Accounting estimates that are frequently made and updated because they relate to routine transactions.</li>
              <li>Accounting estimates derived from data that is readily available. Such data may be referred to as 'observable' in the context of a fair value accounting estimate.</li>
              <li>Accounting estimates arising in entities that engage in business activities that are not complex.</li>
              <li>Fair value accounting estimates where the method of measurement prescribed by the applicable financial reporting framework is simple and applied easily to the asset or liability requiring measurement at fair value.</li>
              <li>Fair value accounting estimates where the model used to measure the accounting estimate is well-known or generally accepted, provided that the assumptions or inputs to the model are observable.</li>
            </ul>
            <div className="flex gap-4 text-white/90 text-sm">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="Impt-4" value={opt} checked={answers["Impt-4"] === opt} onChange={(e) => setAnswer("Impt-4", e.target.value)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {answers["Impt-4"] === "Yes" && (
              <div className="mt-2">
                <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
              </div>
            )}
          </div>

          {/* Impt-5 */}
          <div className="space-y-2">
            <div className="text-white text-sm font-medium">Impt-5. Is there any significant management bias involved in any of the assumptions?</div>
            <div className="flex gap-4 text-white/90 text-sm">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="Impt-5" value={opt} checked={answers["Impt-5"] === opt} onChange={(e) => setAnswer("Impt-5", e.target.value)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {answers["Impt-5"] === "Yes" && (
              <div className="mt-2">
                <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
              </div>
            )}
          </div>

          {/* Impt-6 with follow-up */}
          <div className="space-y-2">
            <div className="text-white text-sm font-medium">Impt-6. Has the management used any expert in arriving at the estimate?</div>
            <div className="flex gap-4 text-white/90 text-sm">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="Impt-6" value={opt} checked={answers["Impt-6"] === opt} onChange={(e) => setAnswer("Impt-6", e.target.value)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {answers["Impt-6"] === "Yes" && (
              <div className="space-y-2">
                <div className="text-white text-sm">Follow-up: Have we used the work of management’s expert as audit evidence?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Impt-6-follow" value={opt} checked={answers["Impt-6-follow"] === opt} onChange={(e) => setAnswer("Impt-6-follow", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Impt-6-follow"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Impt-7 */}
          <div className="space-y-2">
            <div className="text-white text-sm font-medium">Impt-7. Have we used an expert to determine the recoverable amount/value-in-use as per the applicable financial reporting framework?</div>
            <div className="flex gap-4 text-white/90 text-sm">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="Impt-7" value={opt} checked={answers["Impt-7"] === opt} onChange={(e) => setAnswer("Impt-7", e.target.value)} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {answers["Impt-7"] === "Yes" && (
              <div className="space-y-2">
                <div className="text-white text-xs">Note: Document the procedures relating to use of auditor’s expert in Auditor’s Expert workspace.</div>
                <div>
                  <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



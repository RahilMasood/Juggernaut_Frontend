"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";

interface DepreciationTailoringQuestionsProps {
  onBack?: () => void;
}

type AnswerMap = Record<string, string>;

export default function DepreciationTailoringQuestions({ onBack }: DepreciationTailoringQuestionsProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [ppe1, setPpe1] = useState<"Yes" | "No">("No");

  const setAnswer = (id: string, value: string) => setAnswers((p) => ({ ...p, [id]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Depreciation - Tailoring Questions</h2>
          <p className="text-gray-400">Customize the program. Toggle whether PPE-1 is Yes/No.</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      </div>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-white">Context Toggle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-white">
            <span className="text-sm">Is PPE-1 Yes?</span>
            <Button variant="outline" size="sm" onClick={() => setPpe1(ppe1 === "Yes" ? "No" : "Yes")}>
              {ppe1 === "Yes" ? <ToggleRight className="h-4 w-4 mr-2" /> : <ToggleLeft className="h-4 w-4 mr-2" />}
              {ppe1}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle className="text-white">Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Depr-1 */}
          <div className="space-y-2">
            <div className="text-white text-sm font-medium">Depr-1. Document procedures performed to test depreciation expense on right-of-use assets held by the entity.</div>
            <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload document</Button>
          </div>

          {/* Branch when PPE-1 == No */}
          {ppe1 === "No" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-2. Which method of depreciation is followed by the entity?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Straight-line method", "Written Down Value method", "Any other"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-2" value={opt} checked={answers["Depr-2"] === opt} onChange={(e) => setAnswer("Depr-2", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-2"] === "Any other" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-3. Is there any significant degree of estimation uncertainty involved in any of the assumptions?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-3" value={opt} checked={answers["Depr-3"] === opt} onChange={(e) => setAnswer("Depr-3", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-3"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-4. Is there any significant management bias involved?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-4" value={opt} checked={answers["Depr-4"] === opt} onChange={(e) => setAnswer("Depr-4", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-4"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-5. Has the management used any expert in arriving at the estimate?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-5" value={opt} checked={answers["Depr-5"] === opt} onChange={(e) => setAnswer("Depr-5", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-5"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-6. Which procedure has the ET assessed as suitable?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Recomputation", "Substantive Analytical Procedure"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-6" value={opt} checked={answers["Depr-6"] === opt} onChange={(e) => setAnswer("Depr-6", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Branch when PPE-1 == Yes */}
          {ppe1 === "Yes" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-9. Which method of depreciation is followed by the entity?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Straight-line method", "Written Down Value method", "Any other"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-9" value={opt} checked={answers["Depr-9"] === opt} onChange={(e) => setAnswer("Depr-9", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-10. Estimation uncertainty involved?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-10" value={opt} checked={answers["Depr-10"] === opt} onChange={(e) => setAnswer("Depr-10", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-10"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-11. Management bias involved?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-11" value={opt} checked={answers["Depr-11"] === opt} onChange={(e) => setAnswer("Depr-11", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-11"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-12. Has management used any expert?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-12" value={opt} checked={answers["Depr-12"] === opt} onChange={(e) => setAnswer("Depr-12", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {answers["Depr-12"] === "Yes" && (
                  <div className="mt-2">
                    <Button size="sm" onClick={async () => { try { await (window as any).payroll.uploadFile(); } catch {} }}>Upload supporting document</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-white text-sm font-medium">Depr-13. Which procedure has the ET assessed as suitable?</div>
                <div className="flex gap-4 text-white/90 text-sm">
                  {["Recomputation", "Substantive Analytical Procedure"].map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="Depr-13" value={opt} checked={answers["Depr-13"] === opt} onChange={(e) => setAnswer("Depr-13", e.target.value)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



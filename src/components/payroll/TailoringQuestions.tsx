"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

interface TailoringQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
  follow_up?: {
    condition: string;
    id: string;
    question: string;
    type: string;
    options?: string[];
  };
}

interface TailoringQuestionsProps {
  onBack?: () => void;
  onComplete?: (answers: Record<string, string>) => void;
}

export default function TailoringQuestions({
  onBack,
  onComplete,
}: TailoringQuestionsProps) {
  const [questions, setQuestions] = useState<TailoringQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tailoring questions (hardcoded for Employee Benefit Expense)
  useEffect(() => {
    setLoading(true);
    
    // Hardcoded tailoring questions for Employee Benefit Expense
    const tailoringQuestions: TailoringQuestion[] = [
      {
        id: "Payroll-1",
        question: "Does the entity have any accounting estimates relating to payroll? (for eg. gratuity, other employee benefits, etc.)",
        type: "radio",
        options: ["Yes", "No"],
        follow_up: {
          condition: "Yes",
          id: "Payroll-2",
          question: "Does the management use an expert for these estimates?",
          type: "radio",
          options: ["Yes", "No"]
        }
      },
      {
        id: "Payroll-3",
        question: "Has the entity capitalized any portion of its salary for ongoing/completed projects?",
        type: "radio",
        options: ["Yes", "No"]
      }
    ];
    
    setQuestions(tailoringQuestions);
    setLoading(false);
  }, []);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(answers);
    }
  };

  const isQuestionAnswered = (questionId: string) => {
    return answers[questionId] !== undefined && answers[questionId] !== "";
  };

  const shouldShowFollowUp = (question: TailoringQuestion) => {
    if (!question.follow_up) return false;
    return answers[question.id] === question.follow_up.condition;
  };

  const allQuestionsAnswered = () => {
    return questions.every(q => {
      const mainAnswered = isQuestionAnswered(q.id);
      const followUpAnswered = !shouldShowFollowUp(q) || isQuestionAnswered(q.follow_up!.id);
      return mainAnswered && followUpAnswered;
    });
  };

  const renderQuestion = (question: TailoringQuestion, isFollowUp = false) => {
    const isAnswered = isQuestionAnswered(question.id);
    
    return (
      <Card key={question.id} className={`border-white/10 bg-white/5 text-white ${isFollowUp ? 'ml-6 border-l-2 border-l-[#4da3ff]/30' : ''}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {isAnswered ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-white/40" />
                )}
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium text-white">
                  {question.question}
                </Label>
              </div>
            </div>

            {question.type === "radio" && question.options && (
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
                className="ml-8"
              >
                {question.options.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option} 
                      id={`${question.id}-${option}`}
                      className="border-white/20 text-[#4da3ff] focus:ring-[#4da3ff]/20"
                    />
                    <Label 
                      htmlFor={`${question.id}-${option}`}
                      className="text-sm text-white/80 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "text" && (
              <div className="ml-8">
                <Textarea
                  placeholder="Enter your answer here..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="min-h-[80px] bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-[#4da3ff]/50 focus:ring-[#4da3ff]/20"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">Tailoring Questions</h2>
            <p className="text-sm text-white/60">Loading questions...</p>
          </div>
        </div>
        
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="p-6">
            <div className="text-center text-white/60">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4da3ff] mx-auto mb-4"></div>
              <p>Loading tailoring questions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">Tailoring Questions</h2>
            <p className="text-sm text-white/60">Error loading questions</p>
          </div>
        </div>
        
        <Card className="border-red-500/20 bg-red-500/5 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <h3 className="font-medium text-red-400">Error</h3>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-white">Tailoring Questions</h2>
          <p className="text-sm text-white/60">
            Answer these questions to tailor the audit approach for payroll
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Progress</span>
              <Badge variant="outline" className="text-xs">
                {questions.filter(q => isQuestionAnswered(q.id)).length} / {questions.length} answered
              </Badge>
            </div>
            <div className="text-xs text-white/60">
              {Math.round((questions.filter(q => isQuestionAnswered(q.id)).length / questions.length) * 100)}% complete
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="space-y-3">
            {renderQuestion(question)}
            {shouldShowFollowUp(question) && question.follow_up && (
              <div className="transition-all duration-300">
                {renderQuestion(question.follow_up, true)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              {allQuestionsAnswered() 
                ? "All questions completed. You can proceed to the next step."
                : "Please answer all questions to proceed."
              }
            </div>
            <Button
              onClick={handleComplete}
              disabled={!allQuestionsAnswered()}
              className="bg-[#4da3ff] text-white hover:bg-[#4da3ff]/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

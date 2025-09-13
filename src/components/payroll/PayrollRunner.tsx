"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type UploadSlot = {
  id: string;
  label: string;
  paths: string[];
};

const SCRIPTS = [
  { key: "ipe_testing", label: "IPE Testing" },
  { key: "exception_testing", label: "Exception Testing" },
  { key: "headcount_reconciliation", label: "Headcount Reconciliation" },
  { key: "mom_analysis", label: "Month-on-Month Analysis" },
  { key: "increment_analysis", label: "Increment Analysis" },
  { key: "pf_sal_analytics", label: "PF & Salary Analytics" },
  { key: "actuary_testing", label: "Actuary Testing" },
  { key: "accuracy_check", label: "Accuracy Check" },
];

export default function PayrollRunner() {
  const [accepted, setAccepted] = useState<string[]>([]);
  const [script, setScript] = useState<string>(SCRIPTS[0].key);
  const [slots, setSlots] = useState<UploadSlot[]>([
    { id: "inputs", label: "Input files (Excel/CSV/JSON)", paths: [] },
  ]);
  const [running, setRunning] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    progress: number;
    status: string;
    message?: string;
    error?: string;
  } | null>(null);
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof window.payroll.listResults>>
  >([]);

  useEffect(() => {
    window.payroll.acceptedInputs().then(setAccepted);
    const off = window.payroll.onProgress((p) => {
      setProgress({
        progress: p.progress,
        status: p.status,
        message: p.message,
        error: p.error,
      });
    });
    return () => off();
  }, []);

  const acceptAttr = useMemo(() => accepted.join(","), [accepted]);

  const handleInput = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slotId: string,
  ) => {
    const files = e.target.files;
    if (!files) return;
    const paths: string[] = [];
    for (const f of Array.from(files)) {
      // @ts-expect-error electron adds .path
      if (f.path) paths.push(f.path);
    }
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, paths } : s)),
    );
    e.currentTarget.value = "";
  };

  const pickFiles = async () => {
    const paths = await window.payroll.openDialog();
    if (paths && paths.length > 0) {
      setSlots((prev) =>
        prev.map((s) => (s.id === "inputs" ? { ...s, paths } : s)),
      );
    }
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    setProgress({ progress: 0, status: "running" });
    const inputFiles = slots.flatMap((s) => s.paths);
    const res = await window.payroll.run(script, { inputFiles });
    if (!res.ok) {
      setProgress({
        progress: 100,
        status: "error",
        error: res.error || "Failed",
      });
      setRunning(false);
      return;
    }
    setLastRunId(res.runId || null);
    const list = await window.payroll.listResults();
    setResults(list);
    setRunning(false);
  };

  const download = async (id: string) => {
    await window.payroll.downloadResult(id);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-white">
        <div className="mb-4 text-sm">
          Run Payroll Python scripts on uploaded inputs.
        </div>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="mb-1 text-xs text-white/60">Select Script</div>
            <Select value={script} onValueChange={setScript}>
              <SelectTrigger className="bg-black/40 text-white">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 text-white">
                {SCRIPTS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-white/60">{slots[0].label}</div>
            <Input
              type="file"
              multiple
              accept={acceptAttr}
              onChange={(e) => handleInput(e, slots[0].id)}
            />
            {slots[0].paths.length > 0 && (
              <div className="mt-1 text-xs text-white/50">
                {slots[0].paths.length} files selected
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={pickFiles} disabled={running}>
            Pick files
          </Button>
          <Button onClick={run} disabled={running}>
            {running ? "Running..." : "Run"}
          </Button>
        </div>
        {progress && (
          <div className="mt-3 text-xs text-white/70">
            <div>
              Progress: {progress.progress}% ({progress.status})
            </div>
            {progress.message && (
              <div className="text-white/60">{progress.message}</div>
            )}
            {progress.error && (
              <div className="text-red-400">{progress.error}</div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-white">
        <div className="mb-2 text-sm">Results</div>
        <div className="space-y-2">
          {results.length === 0 && (
            <div className="text-xs text-white/60">No results yet.</div>
          )}
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border border-white/10 bg-black/40 p-2 text-xs"
            >
              <div>
                <div className="font-medium">{r.label}</div>
                <div className="text-white/60">
                  {new Date(r.createdAt).toLocaleString()} ·{" "}
                  {Math.round(r.size / 1024)} KB
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => download(r.id)}
              >
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

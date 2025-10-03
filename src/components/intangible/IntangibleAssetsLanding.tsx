import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShieldCheck, Layers, Lock, FileCheck2 } from "lucide-react";

type IntangibleAssetsLandingProps = {
  onSelect: (section: string) => void;
};

const categories: Array<{
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  { id: "ia-tailoring", title: "Tailoring Questions", description: "Customize the audit program for Intangibles.", icon: Layers, accent: "from-blue-500/20 to-indigo-500/20" },
  { id: "ia-romms", title: "RoMMs", description: "Identify and assess risks for Intangibles.", icon: ShieldCheck, accent: "from-amber-500/20 to-orange-500/20" },
  { id: "ia-controls", title: "Internal Controls", description: "Evaluate design and implementation of controls.", icon: Lock, accent: "from-emerald-500/20 to-teal-500/20" },
  { id: "ia-substantive", title: "Substantive Procedures", description: "Perform detailed procedures over Intangibles.", icon: FileCheck2, accent: "from-fuchsia-500/20 to-purple-500/20" },
];

export default function IntangibleAssetsLanding({ onSelect }: IntangibleAssetsLandingProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Intangible Assets</h2>
          <p className="text-sm text-white/60">Choose a workflow to proceed. You can return here anytime.</p>
        </div>
        <Badge className="bg-white/10 text-white/80">Execution</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.id}
              className="group cursor-pointer border-white/10 bg-white/5 text-white backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10"
              onClick={() => onSelect(cat.id)}
            >
              <CardContent className="p-4">
                <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${cat.accent} p-2`}>
                  <Icon className="h-5 w-5 text-white/80" />
                </div>
                <div className="mb-1 text-sm font-semibold">{cat.title}</div>
                <div className="mb-4 text-xs text-white/60">{cat.description}</div>
                <Button size="sm" variant="outline" className="border-white/10 text-xs text-white/80 group-hover:bg-white/10 group-hover:text-white">Continue</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}





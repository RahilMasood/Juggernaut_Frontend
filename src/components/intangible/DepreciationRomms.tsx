import React from "react";
import PayrollRomms from "../payroll/PayrollRomms";

interface DepreciationRommsProps {
  onBack: () => void;
}

export default function DepreciationRomms({ onBack }: DepreciationRommsProps) {
  return <PayrollRomms onBack={onBack} onComplete={() => {}} />;
}



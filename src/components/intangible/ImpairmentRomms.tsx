import React from "react";
import PayrollRomms from "../payroll/PayrollRomms";

interface ImpairmentRommsProps {
  onBack: () => void;
}

export default function ImpairmentRomms({ onBack }: ImpairmentRommsProps) {
  return <PayrollRomms onBack={onBack} onComplete={() => {}} />;
}



import { describe, it, expect } from 'vitest';

// Test data structure for PAR
interface PARData {
  par: string;
  closing_balance: number;
  opening_balance: number;
  variance: number;
  variance_percentage: number;
  exceeds_materiality: boolean;
  considered_significant: "Significant" | "Not Significant" | "";
}

// Business logic functions to test
function calculateVariance(closing_balance: number, opening_balance: number) {
  return closing_balance - opening_balance;
}

function calculateVariancePercentage(variance: number, opening_balance: number) {
  if (opening_balance === 0) return 0;
  return (variance / Math.abs(opening_balance)) * 100;
}

function checkExceedsMateriality(closing_balance: number, materiality_threshold: number) {
  return Math.abs(closing_balance) > materiality_threshold;
}

function processParData(data: any[], materiality_threshold: number): PARData[] {
  // Group by PAR and aggregate balances
  const parGroups = data.reduce((acc: Record<string, any>, item: any) => {
    const parKey = item.par || 'Unclassified';
    
    if (!acc[parKey]) {
      acc[parKey] = {
        par: parKey,
        closing_balance: 0,
        opening_balance: 0,
        note_line: item.note_line,
        type: item.type,
      };
    }
    
    acc[parKey].closing_balance += item.closing_balance || 0;
    acc[parKey].opening_balance += item.opening_balance || 0;
    
    return acc;
  }, {});

  // Calculate variances and materiality checks
  return Object.values(parGroups).map((item: any) => {
    const variance = calculateVariance(item.closing_balance, item.opening_balance);
    const variance_percentage = calculateVariancePercentage(variance, item.opening_balance);
    const exceeds_materiality = checkExceedsMateriality(item.closing_balance, materiality_threshold);

    return {
      ...item,
      variance,
      variance_percentage,
      exceeds_materiality,
      considered_significant: exceeds_materiality ? "Significant" : "Not Significant",
    };
  });
}

describe('Preliminary Analytical Procedures Business Logic', () => {
  it('should calculate variance correctly', () => {
    expect(calculateVariance(1000, 800)).toBe(200);
    expect(calculateVariance(800, 1000)).toBe(-200);
    expect(calculateVariance(1000, 1000)).toBe(0);
  });

  it('should calculate variance percentage correctly', () => {
    expect(calculateVariancePercentage(200, 1000)).toBe(20);
    expect(calculateVariancePercentage(-200, 1000)).toBe(-20);
    expect(calculateVariancePercentage(100, 0)).toBe(0);
    expect(calculateVariancePercentage(50, -200)).toBe(25);
  });

  it('should check materiality threshold correctly', () => {
    expect(checkExceedsMateriality(1500, 1000)).toBe(true);
    expect(checkExceedsMateriality(800, 1000)).toBe(false);
    expect(checkExceedsMateriality(-1500, 1000)).toBe(true);
  });

  it('should process PAR data correctly', () => {
    const testData = [
      {
        par: "Trade Receivables",
        closing_balance: 1000,
        opening_balance: 800,
        note_line: "Trade Receivables",
        type: "Asset"
      },
      {
        par: "Trade Receivables", 
        closing_balance: 500,
        opening_balance: 200,
        note_line: "Trade Receivables",
        type: "Asset"
      },
      {
        par: "Cash & Cash Equivalents",
        closing_balance: 2000,
        opening_balance: 1500,
        note_line: "Cash & Cash Equivalents",
        type: "Asset"
      }
    ];

    const materiality_threshold = 1000;
    const result = processParData(testData, materiality_threshold);

    expect(result).toHaveLength(2);
    
    const tradeReceivables = result.find(item => item.par === "Trade Receivables");
    expect(tradeReceivables).toBeDefined();
    expect(tradeReceivables?.closing_balance).toBe(1500);
    expect(tradeReceivables?.opening_balance).toBe(1000);
    expect(tradeReceivables?.variance).toBe(500);
    expect(tradeReceivables?.variance_percentage).toBe(50);
    expect(tradeReceivables?.exceeds_materiality).toBe(true);
    expect(tradeReceivables?.considered_significant).toBe("Significant");

    const cash = result.find(item => item.par === "Cash & Cash Equivalents");
    expect(cash).toBeDefined();
    expect(cash?.closing_balance).toBe(2000);
    expect(cash?.opening_balance).toBe(1500);
    expect(cash?.variance).toBe(500);
    expect(cash?.variance_percentage).toBeCloseTo(33.33, 2);
    expect(cash?.exceeds_materiality).toBe(true);
    expect(cash?.considered_significant).toBe("Significant");
  });

  it('should handle edge cases', () => {
    const testData = [
      {
        par: "Zero Balance",
        closing_balance: 0,
        opening_balance: 0,
        note_line: "Zero Balance",
        type: "Asset"
      },
      {
        par: undefined, // Test undefined PAR
        closing_balance: 100,
        opening_balance: 50,
        note_line: "Unclassified Item",
        type: "Asset"
      }
    ];

    const materiality_threshold = 1000;
    const result = processParData(testData, materiality_threshold);

    expect(result).toHaveLength(2);
    
    const zeroBalance = result.find(item => item.par === "Zero Balance");
    expect(zeroBalance?.variance).toBe(0);
    expect(zeroBalance?.variance_percentage).toBe(0);
    expect(zeroBalance?.exceeds_materiality).toBe(false);

    const unclassified = result.find(item => item.par === "Unclassified");
    expect(unclassified).toBeDefined();
    expect(unclassified?.closing_balance).toBe(100);
  });
});

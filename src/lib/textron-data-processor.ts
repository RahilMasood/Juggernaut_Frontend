// Import new data files
import combinedData from '../data/Combined.json'
import sezData from '../data/Sez.json'
import nonSezData from '../data/NonSez.json'
import formulaData from '../data/Formula.json'

interface TextronLedgerEntry {
  ledger_name: string
  opening_balance: number
  closing_balance: number
  note_line: string
  note_line_id: number
  fs_sub_line: string
  fs_sub_line_id: number
  fs_line: string
  fs_line_id: number
  type: string
  mapping: string
  book_name?: string // Only in Combined.json
}

interface FinancialMetrics {
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  currentAssets: number
  currentLiabilities: number
  workingCapital: number
  profitMargin: number
  returnOnAssets: number
  returnOnEquity: number
  currentRatio: number
  debtToAssetRatio: number
  debtToEquityRatio: number
}

interface FinancialRatio {
  name: string
  value: number | null
  formula: string
  description: string
  category: string
  isPercentage: boolean
  isDays: boolean
  underlying?: {
    numerator: number
    denominator: number
  }
}

interface YearlyFinancialData {
  year: string
  currentAssets: number
  currentLiabilities: number
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalDebt: number
  revenueFromOperations: number
  profitForPeriod: number
  tradeReceivables: number
  tradePayables: number
  inventory: number
  costOfMaterialsConsumed: number
  purchasesOfStockInTrade: number
  changesInInventories: number
  openingInventory: number
  closingInventory: number
  openingDebtors: number
  closingDebtors: number
  openingPayables: number
  closingPayables: number
}

// Combine both datasets or allow selection
function getCombinedData(): TextronLedgerEntry[] {
  return combinedData.data as TextronLedgerEntry[]
}

function getSezData(): TextronLedgerEntry[] {
  return sezData.data as TextronLedgerEntry[]
}

function getNonSezData(): TextronLedgerEntry[] {
  return nonSezData.data as TextronLedgerEntry[]
}

// Function to extract company name from the data
export function getCompanyName(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): string {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
      // Look for entries that contain "Textron India Private Limited"
    const textronEntries = data.filter(entry => 
      entry.ledger_name.includes("Textron India Private Limited")
    )
    
    if (textronEntries.length > 0) {
      // Extract the most common company name pattern
      const firstEntry = textronEntries[0]
      if (firstEntry) {
        const companyName = firstEntry.ledger_name
      if (companyName.includes("Non SEZ")) {
        return "Textron India Private Limited (Non SEZ)"
      } else if (companyName.includes("SEZ")) {
        return "Textron India Private Limited (SEZ)"
      }
    }
    return "Textron India Private Limited"
  }
  
  // Fallback to a default name
  return "Textron India Private Limited"
}

// Function to get financial year from the data
export function getFinancialYear(): string {
  // Since the data appears to be for 2022-23 based on the file names, 
  // we'll return the current year for now
  return "2023-24"
}

// Mock multi-year data for historical comparison
const mockMultiYearData: YearlyFinancialData[] = [
  {
    year: "2020-21",
    currentAssets: 120000000,
    currentLiabilities: 800000,
    totalAssets: 125000000,
    totalLiabilities: 5000000,
    totalEquity: 120000000,
    totalDebt: 5000000,
    revenueFromOperations: 75000000,
    profitForPeriod: 15000000,
    tradeReceivables: 8000000,
    tradePayables: 600000,
    inventory: 0,
    costOfMaterialsConsumed: 0,
    purchasesOfStockInTrade: 0,
    changesInInventories: 0,
    openingInventory: 0,
    closingInventory: 0,
    openingDebtors: 7500000,
    closingDebtors: 8000000,
    openingPayables: 550000,
    closingPayables: 600000,
  },
  {
    year: "2021-22",
    currentAssets: 130000000,
    currentLiabilities: 900000,
    totalAssets: 135000000,
    totalLiabilities: 5500000,
    totalEquity: 129500000,
    totalDebt: 5500000,
    revenueFromOperations: 82000000,
    profitForPeriod: 16500000,
    tradeReceivables: 8500000,
    tradePayables: 650000,
    inventory: 0,
    costOfMaterialsConsumed: 0,
    purchasesOfStockInTrade: 0,
    changesInInventories: 0,
    openingInventory: 0,
    closingInventory: 0,
    openingDebtors: 8000000,
    closingDebtors: 8500000,
    openingPayables: 600000,
    closingPayables: 650000,
  },
  {
    year: "2022-23",
    currentAssets: 142000000,
    currentLiabilities: 1000000,
    totalAssets: 147000000,
    totalLiabilities: 6500000,
    totalEquity: 140500000,
    totalDebt: 6500000,
    revenueFromOperations: 92000000,
    profitForPeriod: 18000000,
    tradeReceivables: 9500000,
    tradePayables: 750000,
    inventory: 0,
    costOfMaterialsConsumed: 0,
    purchasesOfStockInTrade: 0,
    changesInInventories: 0,
    openingInventory: 0,
    closingInventory: 0,
    openingDebtors: 9000000,
    closingDebtors: 9500000,
    openingPayables: 700000,
    closingPayables: 750000,
  }
]

export function processTextronData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): FinancialMetrics {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  // Use Formula.json data for balance sheet items if available
  const bsData = formulaData["BS-AS"]
  const plData = formulaData["PL-AS"]
  
  // Calculate totals using Formula.json data when available, fallback to calculated data
  const totalAssets = Math.abs(bsData["Total Assets"]) || data
    .filter(entry => entry.type === 'Asset')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalLiabilities = Math.abs(bsData["Total Liabilities"]) || data
    .filter(entry => entry.type === 'Liability')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalEquity = Math.abs(bsData["Shareholder Fund"]) || data
    .filter(entry => entry.type === 'Equity')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalRevenue = Math.abs(plData["TOTAL REVENUE"]) || data
    .filter(entry => entry.type === 'Income')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalExpenses = Math.abs(plData["TOTAL EXPENSES"]) || data
    .filter(entry => entry.type === 'Expense')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  // Calculate current assets and liabilities using Formula.json data
  const currentAssets = Math.abs(bsData["Current Assets"]) || data
    .filter(entry => entry.type === 'Asset' && entry.fs_line === 'Current Assets')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const currentLiabilities = Math.abs(bsData["Current Liabilities"]) || data
    .filter(entry => entry.type === 'Liability' && entry.fs_line === 'Current Liabilities')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  // Calculate derived metrics using Formula.json data when available
  const netIncome = Math.abs(plData["PROFIT/(LOSS) FOR THE PERIOD"]) || (totalRevenue - totalExpenses)
  const workingCapital = currentAssets - currentLiabilities
  const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
  const returnOnAssets = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0
  const returnOnEquity = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0
  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0
  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0
  const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0

  return {
    totalAssets,
    totalLiabilities,
    totalEquity: totalEquity || totalAssets - totalLiabilities,
    totalRevenue,
    totalExpenses,
    netIncome,
    currentAssets,
    currentLiabilities,
    workingCapital,
    profitMargin,
    returnOnAssets,
    returnOnEquity,
    currentRatio,
    debtToAssetRatio,
    debtToEquityRatio
  }
}

function getCurrentYearData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): YearlyFinancialData {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  // Extract current year data from Textron data
  const currentAssets = data
    .filter(entry => entry.type === 'Asset' && entry.fs_line === 'Current Assets')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const currentLiabilities = data
    .filter(entry => entry.type === 'Liability' && entry.fs_line === 'Current Liabilities')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalAssets = data
    .filter(entry => entry.type === 'Asset')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalLiabilities = data
    .filter(entry => entry.type === 'Liability')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const totalEquity = data
    .filter(entry => entry.type === 'Equity')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const revenueFromOperations = data
    .filter(entry => entry.type === 'Income' && entry.fs_sub_line === 'Revenue from Operations')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const profitForPeriod = data
    .filter(entry => entry.type === 'Income')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0) -
    data
    .filter(entry => entry.type === 'Expense')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const tradeReceivables = data
    .filter(entry => entry.type === 'Asset' && entry.fs_sub_line === 'Trade Receivables')
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  const tradePayables = data
    .filter(entry => entry.type === 'Liability' && (entry.fs_sub_line === 'Trade Payable - Others' || entry.fs_sub_line.includes('Trade Payable')))
    .reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0)
  
  // For current year, use opening and closing balances
  const openingDebtors = data
    .filter(entry => entry.type === 'Asset' && entry.fs_sub_line === 'Trade Receivables')
    .reduce((sum, entry) => sum + Math.abs(entry.opening_balance), 0)
  
  const closingDebtors = tradeReceivables
  
  const openingPayables = data
    .filter(entry => entry.type === 'Liability' && (entry.fs_sub_line === 'Trade Payable - Others' || entry.fs_sub_line.includes('Trade Payable')))
    .reduce((sum, entry) => sum + Math.abs(entry.opening_balance), 0)
  
  const closingPayables = tradePayables
  
  return {
    year: getFinancialYear(),
    currentAssets,
    currentLiabilities,
    totalAssets,
    totalLiabilities,
    totalEquity: totalEquity || totalAssets - totalLiabilities,
    totalDebt: totalLiabilities,
    revenueFromOperations,
    profitForPeriod,
    tradeReceivables,
    tradePayables,
    inventory: 0, // Not available in current data structure
    costOfMaterialsConsumed: 0, // Not available in current data structure
    purchasesOfStockInTrade: 0, // Not available in current data structure
    changesInInventories: 0, // Not available in current data structure
    openingInventory: 0, // Not available in current data structure
    closingInventory: 0, // Not available in current data structure
    openingDebtors,
    closingDebtors,
    openingPayables,
    closingPayables,
  }
}

export function getMultiYearData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): YearlyFinancialData[] {
  const currentYearData = getCurrentYearData(dataSource)
  return [...mockMultiYearData, currentYearData]
}

// Function to get balance sheet data formatted for the balance sheet component
export function getTextronBalanceSheetData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined') {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  return data
    .filter(entry => (entry.type === 'Asset' || entry.type === 'Liability' || entry.type === 'Equity') && Math.abs(entry.closing_balance) > 0)
    .map(entry => ({
      name: entry.ledger_name,
      amount: entry.closing_balance,
      type: entry.type.toLowerCase() as "asset" | "liability" | "equity",
      category: entry.fs_sub_line ?? entry.fs_line ?? "Other",
      fsLine: entry.fs_line ?? "Other",
      fsSubLine: entry.fs_sub_line ?? "Other",
      noteLine: entry.note_line ?? "Other"
    }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)) // Sort by amount descending
}

// Function to get structured balance sheet data grouped by FS Lines and Sub Lines
export function getStructuredBalanceSheetData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined') {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  const balanceSheetData = data.filter(entry => 
    (entry.type === 'Asset' || entry.type === 'Liability' || entry.type === 'Equity') && 
    Math.abs(entry.closing_balance) > 0
  )

  interface BalanceSheetItem {
    name: string
    amount: number
    type: "asset" | "liability" | "equity"
    fsLine: string
    fsSubLine: string
    noteLine: string
  }

  // Group by type, then FS Sub Line for simpler structure
  const grouped: Record<string, Record<string, BalanceSheetItem[]>> = {}

  balanceSheetData.forEach(entry => {
    const fsSubLine = entry.fs_sub_line ?? entry.fs_line ?? "Other"
    const type = entry.type

    grouped[type] ??= {}
    grouped[type][fsSubLine] ??= []

    grouped[type][fsSubLine].push({
      name: entry.ledger_name,
      amount: entry.closing_balance,
      type: type.toLowerCase() as "asset" | "liability" | "equity",
      fsLine: entry.fs_line ?? "Other",
      fsSubLine: fsSubLine,
      noteLine: entry.note_line ?? "Other"
    })
  })

  return grouped
}

// Function to get trial balance data formatted for the trial balance component
export function getTextronTrialBalanceData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined') {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  return data
    .filter(entry => Math.abs(entry["closing_balance"]) > 0 || Math.abs(entry["opening_balance"]) > 0)
    .map(entry => {
      const closingBalance = entry["closing_balance"]
      return {
        account: entry["ledger_name"],
        debit: closingBalance > 0 ? closingBalance : 0,
        credit: closingBalance < 0 ? Math.abs(closingBalance) : 0,
        type: entry.type,
        category: entry["fs_sub_line"] || entry["fs_line"] || "Other"
      }
    })
    .sort((a, b) => a.account.localeCompare(b.account))
}

// Enhanced Trial Balance interface for SEZ data display
interface EnhancedTrialBalanceEntry {
  ledgerName: string
  openingBalance: number
  closingBalance: number
  debit: number
  credit: number
  noteLine: string
  noteLineId: number
  fsLineId: number
  fsLineIdType: string
  type: string
  fsLine: string
  fsSubLine: string
}

// Function to get enhanced trial balance data for SEZ only (for Excel-style display)
export function getEnhancedTrialBalanceData(): EnhancedTrialBalanceEntry[] {
  const data = getSezData() // Only SEZ data as per requirement
  
  return data
    .filter(entry => Math.abs(entry["closing_balance"]) > 0 || Math.abs(entry["opening_balance"]) > 0)
    .map(entry => {
      const closingBalance = entry["closing_balance"]
      return {
        ledgerName: entry["ledger_name"],
        openingBalance: entry["opening_balance"],
        closingBalance: closingBalance,
        debit: closingBalance > 0 ? closingBalance : 0,
        credit: closingBalance < 0 ? Math.abs(closingBalance) : 0,
        noteLine: entry["note_line"],
        noteLineId: entry["note_line_id"],
        fsLineId: entry["fs_line_id"],
        fsLineIdType: entry.type, // This represents the FS Line ID Type
        type: entry.type,
        fsLine: entry["fs_line"],
        fsSubLine: entry["fs_sub_line"]
      }
    })
    .sort((a, b) => a.ledgerName.localeCompare(b.ledgerName))
}

// Function to get profit and loss data formatted for the profit and loss component
export function getTextronProfitLossData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined') {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  return data
    .filter(entry => (entry.type === 'Income' || entry.type === 'Expense') && Math.abs(entry["closing_balance"]) > 0)
    .map(entry => ({
      account: entry["ledger_name"],
      amount: entry["closing_balance"],
      type: entry.type as "Income" | "Expense",
      fsSubLine: entry["fs_sub_line"] ?? entry["fs_line"] ?? "Other",
      fsLine: entry["fs_line"] ?? "Other",
      noteLine: entry["note_line"] ?? "Other"
    }))
    .sort((a, b) => {
      // Sort by type first (Income then Expense), then by amount descending
      if (a.type !== b.type) {
        return a.type === 'Income' ? -1 : 1;
      }
      return Math.abs(b.amount) - Math.abs(a.amount);
    })
}

// Function to format currency consistently across the application
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount)
  if (absAmount >= 10000000) {
    return `₹${(absAmount / 10000000).toFixed(2)}Cr`
  } else if (absAmount >= 100000) {
    return `₹${(absAmount / 100000).toFixed(2)}L`
  } else if (absAmount >= 1000) {
    return `₹${(absAmount / 1000).toFixed(0)}K`
  } else {
    return `₹${absAmount.toLocaleString("en-IN")}`
  }
}

export function calculateFinancialRatios(yearData: YearlyFinancialData): FinancialRatio[] {
  const ratios: FinancialRatio[] = []
  
  // Use Formula.json Overview data when available
  const overviewData = formulaData["Overview"]
  
  // 1. Current Ratio
  const currentRatio = overviewData["Current_ratio"] !== undefined 
    ? overviewData["Current_ratio"] 
    : (yearData.currentLiabilities > 0 ? yearData.currentAssets / yearData.currentLiabilities : null)
  
  ratios.push({
    name: "Current Ratio",
    value: currentRatio,
    formula: "Current Assets ÷ Current Liabilities",
    description: "Measures company's ability to pay short-term obligations",
    category: "Liquidity",
    isPercentage: false,
    isDays: false,
    underlying: {
      numerator: yearData.currentAssets,
      denominator: yearData.currentLiabilities
    }
  })
  
  // 2. Inventory Turnover Ratio
  const inventoryTurnover = overviewData["Inventory_turnover_ratio"] !== undefined 
    ? overviewData["Inventory_turnover_ratio"] 
    : null
  
  ratios.push({
    name: "Inventory Turnover Ratio",
    value: inventoryTurnover,
    formula: "COGS ÷ Average Inventory",
    description: "Measures how efficiently inventory is managed",
    category: "Efficiency",
    isPercentage: false,
    isDays: false,
    underlying: {
      numerator: 0, // Not available in current data
      denominator: 0
    }
  })
  
  // 3. Inventory Days
  const inventoryDays = overviewData["Inventory_days"] !== undefined 
    ? overviewData["Inventory_days"] 
    : (inventoryTurnover && inventoryTurnover > 0 ? 365 / inventoryTurnover : null)
  
  ratios.push({
    name: "Inventory Days",
    value: inventoryDays,
    formula: "365 ÷ Inventory Turnover Ratio",
    description: "Number of days to sell inventory",
    category: "Efficiency",
    isPercentage: false,
    isDays: true,
    underlying: {
      numerator: 365,
      denominator: inventoryTurnover ?? 0
    }
  })
  
  // 4. Debtor Turnover Ratio
  const debtorTurnover = overviewData["Debtor_turnover_ratio"] !== undefined 
    ? overviewData["Debtor_turnover_ratio"] 
    : null
  
  ratios.push({
    name: "Debtor Turnover Ratio",
    value: debtorTurnover,
    formula: "Revenue from Operations ÷ Average Debtors",
    description: "Measures efficiency of credit collection",
    category: "Efficiency",
    isPercentage: false,
    isDays: false,
    underlying: {
      numerator: yearData.revenueFromOperations,
      denominator: (yearData.openingDebtors + yearData.closingDebtors) / 2
    }
  })
  
  // 5. Debtor Days
  const debtorDays = overviewData["Debtor_days"] !== undefined 
    ? overviewData["Debtor_days"] 
    : (debtorTurnover && debtorTurnover > 0 ? 365 / debtorTurnover : null)
  
  ratios.push({
    name: "Debtor Days",
    value: debtorDays,
    formula: "365 ÷ Debtor Turnover Ratio",
    description: "Average number of days to collect receivables",
    category: "Efficiency",
    isPercentage: false,
    isDays: true,
    underlying: {
      numerator: 365,
      denominator: debtorTurnover ?? 0
    }
  })
  
  // 6. Creditor Turnover Ratio
  const creditorTurnover = overviewData["Creditor_turnover_ratio"] !== undefined 
    ? overviewData["Creditor_turnover_ratio"] 
    : null
  
  ratios.push({
    name: "Creditor Turnover Ratio",
    value: creditorTurnover,
    formula: "Purchases ÷ Average Trade Payables",
    description: "Measures how quickly company pays suppliers",
    category: "Liquidity",
    isPercentage: false,
    isDays: false,
    underlying: {
      numerator: 0, // Not available in current data
      denominator: (yearData.openingPayables + yearData.closingPayables) / 2
    }
  })
  
  // 7. Creditor Days
  const creditorDays = overviewData["Creditor_days"] !== undefined 
    ? overviewData["Creditor_days"] 
    : (creditorTurnover && creditorTurnover > 0 ? 365 / creditorTurnover : null)
  
  ratios.push({
    name: "Creditor Days",
    value: creditorDays,
    formula: "365 ÷ Creditor Turnover Ratio",
    description: "Average number of days to pay suppliers",
    category: "Liquidity",
    isPercentage: false,
    isDays: true,
    underlying: {
      numerator: 365,
      denominator: creditorTurnover ?? 0
    }
  })
  
  // 8. Operating Cycle
  const operatingCycle = overviewData["Operating_cycle"] !== undefined 
    ? overviewData["Operating_cycle"] 
    : ((inventoryDays && debtorDays) ? inventoryDays + debtorDays : null)
  
  ratios.push({
    name: "Operating Cycle",
    value: operatingCycle,
    formula: "Inventory Days + Debtor Days",
    description: "Time to convert inventory to cash",
    category: "Efficiency",
    isPercentage: false,
    isDays: true,
    underlying: {
      numerator: inventoryDays ?? 0,
      denominator: debtorDays ?? 0
    }
  })
  
  // 9. Net Profit Ratio
  const netProfitRatio = overviewData["Net_profit_ratio"] !== undefined 
    ? overviewData["Net_profit_ratio"] * 100 // Convert to percentage
    : (yearData.revenueFromOperations > 0 ? (yearData.profitForPeriod / yearData.revenueFromOperations) * 100 : null)
  
  ratios.push({
    name: "Net Profit Ratio",
    value: netProfitRatio,
    formula: "Profit for the Period ÷ Revenue from Operations × 100",
    description: "Percentage of revenue that becomes profit",
    category: "Profitability",
    isPercentage: true,
    isDays: false,
    underlying: {
      numerator: yearData.profitForPeriod,
      denominator: yearData.revenueFromOperations
    }
  })
  
  // 10. Debt-Equity Ratio
  const debtEquityRatio = overviewData["Debt_equity_ratio"] !== undefined 
    ? overviewData["Debt_equity_ratio"] 
    : (yearData.totalEquity > 0 ? yearData.totalDebt / yearData.totalEquity : null)
  
  if (debtEquityRatio !== null) {
    ratios.push({
      name: "Debt-Equity Ratio",
      value: debtEquityRatio,
      formula: "Total Debt ÷ Total Equity",
      description: "Measures financial leverage",
      category: "Leverage",
      isPercentage: false,
      isDays: false,
      underlying: {
        numerator: yearData.totalDebt,
        denominator: yearData.totalEquity
      }
    })
  }
  
  return ratios
}

export function getFinancialRatiosYoY(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): Record<string, { year: string; value: number | null }[]> {
  const multiYearData = getMultiYearData(dataSource)
  const ratiosYoY: Record<string, { year: string; value: number | null }[]> = {}
  
  multiYearData.forEach(yearData => {
    const ratios = calculateFinancialRatios(yearData)
    
    ratios.forEach(ratio => {
      ratiosYoY[ratio.name] ??= []
      ratiosYoY[ratio.name]?.push({
        year: yearData.year,
        value: ratio.value
      })
    })
  })
  
  return ratiosYoY
}

export function getTopLedgersByType(type: string, limit = 10, dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): TextronLedgerEntry[] {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  return data
    .filter(entry => entry.type === type)
    .sort((a, b) => Math.abs(b["closing_balance"]) - Math.abs(a["closing_balance"]))
    .slice(0, limit)
}

export function getLedgersByFSLine(fsLine: string, dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): TextronLedgerEntry[] {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  return data
    .filter(entry => entry["fs_line"] === fsLine)
    .sort((a, b) => Math.abs(b["closing_balance"]) - Math.abs(a["closing_balance"]))
}

export function getFinancialSummary(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined') {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  // Group by FS Line for summary
  const fsLineSummary = data.reduce((acc, entry) => {
    const fsLine = entry["fs_line"]
    acc[fsLine] ??= {
      total: 0,
      count: 0,
      type: entry.type
    }
    acc[fsLine].total += Math.abs(entry["closing_balance"])
    acc[fsLine].count += 1
    return acc
  }, {} as Record<string, { total: number; count: number; type: string }>)
  
  return fsLineSummary
}

export function formatRatioValue(ratio: FinancialRatio): string {
  if (ratio.value === null) return "N/A"
  
  if (ratio.isPercentage) {
    return `${ratio.value.toFixed(2)}%`
  } else if (ratio.isDays) {
    return `${Math.round(ratio.value)} days`
  } else {
    return ratio.value.toFixed(2)
  }
}

// Mapping View interfaces for the two toggle views
interface MappingViewWithoutAmounts {
  ledgerName: string
  bookName: string
  noteLine: string
  noteLineId: number
  fsSubLine: string
  fsSubLineId: number
  fsLine: string
  fsLineId: number
  type: string
}

interface MappingViewWithAmounts {
  ledgerName: string
  bookName: string
  openingBalance: number
  closingBalance: number
  amount: string // Formatted amount (positive for debit, bracketed for credit)
  noteLine: string
  noteLineId: number
  fsSubLine: string
  fsSubLineId: number
  fsLine: string
  fsLineId: number
  type: string
}

// Function to format amount according to debit/credit rules
function formatMappingAmount(balance: number): string {
  const absBalance = Math.abs(balance)
  const formattedAmount = absBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  if (balance === 0) {
    return "0.00"
  } else if (balance > 0) {
    // Debit amount - display as positive
    return formattedAmount
  } else {
    // Credit amount - display in brackets
    return `(${formattedAmount})`
  }
}

// Function to get mapping view data without amounts (for both SEZ and Non-SEZ)
export function getMappingViewWithoutAmounts(): MappingViewWithoutAmounts[] {
  const sezData = getSezData()
  const nonSezData = getNonSezData()
  
  const sezEntries = sezData
    .filter(entry => Math.abs(entry["closing_balance"]) > 0 || Math.abs(entry["opening_balance"]) > 0)
    .map(entry => ({
      ledgerName: entry["ledger_name"],
      bookName: "SEZ",
      noteLine: entry["note_line"],
      noteLineId: entry["note_line_id"],
      fsSubLine: entry["fs_sub_line"],
      fsSubLineId: entry["fs_sub_line_id"],
      fsLine: entry["fs_line"],
      fsLineId: entry["fs_line_id"],
      type: entry.type
    }))
  
  const nonSezEntries = nonSezData
    .filter(entry => Math.abs(entry["closing_balance"]) > 0 || Math.abs(entry["opening_balance"]) > 0)
    .map(entry => ({
      ledgerName: entry["ledger_name"],
      bookName: "Non-SEZ",
      noteLine: entry["note_line"],
      noteLineId: entry["note_line_id"],
      fsSubLine: entry["fs_sub_line"],
      fsSubLineId: entry["fs_sub_line_id"],
      fsLine: entry["fs_line"],
      fsLineId: entry["fs_line_id"],
      type: entry.type
    }))
  
  return [...sezEntries, ...nonSezEntries]
    .sort((a, b) => a.ledgerName.localeCompare(b.ledgerName))
}

// Function to get mapping view data with amounts (for both SEZ and Non-SEZ)
export function getMappingViewWithAmounts(): MappingViewWithAmounts[] {
  const sezData = getSezData()
  const nonSezData = getNonSezData()
  
  const sezEntries = sezData
    .filter(entry => Math.abs(entry["closing_balance"]) > 0 || Math.abs(entry["opening_balance"]) > 0)
    .map(entry => ({
      ledgerName: entry["ledger_name"],
      bookName: "SEZ",
      openingBalance: entry["opening_balance"],
      closingBalance: entry["closing_balance"],
      amount: formatMappingAmount(entry["closing_balance"]),
      noteLine: entry["note_line"],
      noteLineId: entry["note_line_id"],
      fsSubLine: entry["fs_sub_line"],
      fsSubLineId: entry["fs_sub_line_id"],
      fsLine: entry["fs_line"],
      fsLineId: entry["fs_line_id"],
      type: entry.type
    }))
  
  const nonSezEntries = nonSezData
    .filter(entry => Math.abs(entry["closing_balance"]) > 0 || Math.abs(entry["opening_balance"]) > 0)
    .map(entry => ({
      ledgerName: entry["ledger_name"],
      bookName: "Non-SEZ",
      openingBalance: entry["opening_balance"],
      closingBalance: entry["closing_balance"],
      amount: formatMappingAmount(entry["closing_balance"]),
      noteLine: entry["note_line"],
      noteLineId: entry["note_line_id"],
      fsSubLine: entry["fs_sub_line"],
      fsSubLineId: entry["fs_sub_line_id"],
      fsLine: entry["fs_line"],
      fsLineId: entry["fs_line_id"],
      type: entry.type
    }))
  
  return [...sezEntries, ...nonSezEntries]
    .sort((a, b) => a.ledgerName.localeCompare(b.ledgerName))
}

// New interfaces for debit/credit calculations
interface DebitCreditMetrics {
  totalDebits: number
  totalCredits: number
  netPosition: number
  totalDebitEntries: number
  totalCreditEntries: number
}

// Function to calculate Total Debits, Total Credits, and Net Position
export function calculateDebitCreditMetrics(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): DebitCreditMetrics {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  let totalDebits = 0
  let totalCredits = 0
  let totalDebitEntries = 0
  let totalCreditEntries = 0
  
  data.forEach(entry => {
    const closingBalance = entry["closing_balance"]
    
    if (closingBalance > 0) {
      // Debit entry
      totalDebits += closingBalance
      totalDebitEntries++
    } else if (closingBalance < 0) {
      // Credit entry
      totalCredits += Math.abs(closingBalance)
      totalCreditEntries++
    }
  })
  
  // Calculate Net Position (Total Debits - Total Credits)
  const netPosition = totalDebits - totalCredits
  
  return {
    totalDebits,
    totalCredits,
    netPosition,
    totalDebitEntries,
    totalCreditEntries
  }
}

// Function to get detailed debit/credit breakdown by account type
export function getDebitCreditBreakdown(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): Record<string, DebitCreditMetrics> {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }
  
  const breakdown: Record<string, DebitCreditMetrics> = {}
  
  // Group by account Type
  data.forEach(entry => {
    const type = entry.type
    const closingBalance = entry["closing_balance"]
    
    if (!breakdown[type]) {
      breakdown[type] = {
        totalDebits: 0,
        totalCredits: 0,
        netPosition: 0,
        totalDebitEntries: 0,
        totalCreditEntries: 0
      }
    }
    
    if (closingBalance > 0) {
      breakdown[type].totalDebits += closingBalance
      breakdown[type].totalDebitEntries++
    } else if (closingBalance < 0) {
      breakdown[type].totalCredits += Math.abs(closingBalance)
      breakdown[type].totalCreditEntries++
    }
  })
  
  // Calculate net position for each type
  Object.keys(breakdown).forEach(type => {
    const typeData = breakdown[type]
    if (typeData) {
      typeData.netPosition = typeData.totalDebits - typeData.totalCredits
    }
  })
  
  return breakdown
}

// Interface for formal balance sheet structure
interface FormalBalanceSheetItem {
  name: string;
  currentYear: number;
  previousYear: number;
  variance: number;
  variancePercent: number;
  isSubItem?: boolean;
  isTotal?: boolean;
  level?: number;
}

interface FormalBalanceSheetSection {
  title: string;
  items: FormalBalanceSheetItem[];
  total: FormalBalanceSheetItem;
}

// Function to generate real formal balance sheet data using Formula.json (no calculations)
export function getRealFormalBalanceSheetData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): {
  equityAndLiabilities: FormalBalanceSheetSection;
  assets: FormalBalanceSheetSection;
} {
  // Use Formula.json data for balance sheet items - direct extraction, no calculations
  const bsData = formulaData["BS-AS"]
  
  // Helper function to create balance sheet item with raw data from Formula.json
  const createItem = (name: string, value: number, isSubItem = false, isTotal = false, level = 1): FormalBalanceSheetItem => {
    return {
      name,
      currentYear: value,
      previousYear: 0, // No historical data available
      variance: 0, // No calculations
      variancePercent: 0, // No calculations
      isSubItem,
      isTotal,
      level,
    };
  };

  // Direct extraction from Formula.json - no calculations or transformations
  const shareCapital = bsData["Share Capital"] || 0;
  const reservesSurplus = bsData["Reserves & Surplus"] || 0;
  const moneyReceivedWarrants = bsData["Money Received Against Share Warrants"] || 0;
  const shareApplicationMoney = bsData["Share Application Money Pending Allotment"] || 0;
  
  const longTermBorrowings = bsData["Long-term borrowings"] || 0;
  const deferredTaxLiabilities = bsData["Deferred Tax Liabilities"] || 0;
  const otherLongTermLiabilities = bsData["Other long-term Liabilities"] || 0;
  const longTermProvisions = bsData["Long-term Provisions"] || 0;
  
  const shortTermBorrowings = bsData["Short-term borrowings"] || 0;
  const tradeMsme = bsData["Total outstanding dues of MSME"] || 0;
  const tradeOthers = bsData["Total outstanding dues of creditors other than MSME"] || 0;
  const otherCurrentLiabilities = bsData["Other current liabilities"] || 0;
  const shortTermProvisions = bsData["Short-term Provisions"] || 0;
  
  const tangibleAssets = bsData["Tangible Assets"] || 0;
  const intangibleAssets = bsData["Intangible Assets"] || 0;
  const capitalWorkProgress = bsData["Capital work-in progress"] || 0;
  const intangibleUnderDev = bsData["Intangible Assets Under Development"] || 0;
  const nonCurrentInvestments = bsData["Non-Current Investments"] || 0;
  const deferredTaxAssets = bsData["Deferred Tax Assets"] || 0;
  const longTermLoansAdvances = bsData["Long-term Loans & Advances"] || 0;
  const otherNonCurrentAssets = bsData["Other non-current Assets"] || 0;
  
  const currentInvestments = bsData["Current Investments"] || 0;
  const inventories = bsData["Inventories"] || 0;
  const tradeReceivables = bsData["Trade Receivables"] || 0;
  const cashEquivalents = bsData["Cash & Cash Equivalents"] || 0;
  const shortTermLoansAdvances = bsData["Short-term Loans & Advances"] || 0;
  const otherCurrentAssets = bsData["Other Current Assets"] || 0;

  // Use pre-calculated totals from Formula.json
  const shareholdersFunds = bsData["Shareholder Fund"] || 0;
  const nonCurrentLiabilities = bsData["Non-Current Liabilities"] || 0;
  const currentLiabilities = bsData["Current Liabilities"] || 0;
  const nonCurrentAssets = bsData["Non-Current Assets"] || 0;
  const currentAssets = bsData["Current Assets"] || 0;
  const totalLiabilities = bsData["Total Liabilities"] || 0;
  const totalAssets = bsData["Total Assets"] || 0;

  // Build Equity & Liabilities items using raw data
  const equityAndLiabilitiesItems: FormalBalanceSheetItem[] = [
    createItem("1. Shareholders' Funds", shareholdersFunds, false, true, 1),
    createItem("a. Share Capital", shareCapital, true, false, 2),
    createItem("b. Reserves & Surplus", reservesSurplus, true, false, 2),
    createItem("c. Money Received Against Share Warrants", moneyReceivedWarrants, true, false, 2),
    createItem("2. Share Application Money Pending Allotment", shareApplicationMoney, false, false, 1),
    createItem("3. Non-Current Liabilities", nonCurrentLiabilities, false, true, 1),
    createItem("a. Long-term borrowings", longTermBorrowings, true, false, 2),
    createItem("b. Deferred Tax Liabilities", deferredTaxLiabilities, true, false, 2),
    createItem("c. Other Long-term Liabilities", otherLongTermLiabilities, true, false, 2),
    createItem("d. Long-term Provisions", longTermProvisions, true, false, 2),
    createItem("4. Current Liabilities", currentLiabilities, false, true, 1),
    createItem("a. Short-term borrowings", shortTermBorrowings, true, false, 2),
    createItem("b. Trade Payables - MSME", tradeMsme, true, false, 2),
    createItem("c. Trade Payables - Others", tradeOthers, true, false, 2),
    createItem("d. Other Current Liabilities", otherCurrentLiabilities, true, false, 2),
    createItem("e. Short-term Provisions", shortTermProvisions, true, false, 2),
  ];

  // Build Assets items using raw data
  const assetsItems: FormalBalanceSheetItem[] = [
    createItem("1. Non-Current Assets", nonCurrentAssets, false, true, 1),
    createItem("a. Property, Plant & Equipment", tangibleAssets + intangibleAssets + capitalWorkProgress + intangibleUnderDev, true, false, 2),
    createItem("(i) Tangible Assets", tangibleAssets, true, false, 3),
    createItem("(ii) Intangible Assets", intangibleAssets, true, false, 3),
    createItem("(iii) Capital Work-in-Progress", capitalWorkProgress, true, false, 3),
    createItem("(iv) Intangible Assets Under Development", intangibleUnderDev, true, false, 3),
    createItem("b. Non-Current Investments", nonCurrentInvestments, true, false, 2),
    createItem("c. Deferred Tax Assets", deferredTaxAssets, true, false, 2),
    createItem("d. Long-term Loans & Advances", longTermLoansAdvances, true, false, 2),
    createItem("e. Other Non-current Assets", otherNonCurrentAssets, true, false, 2),
    createItem("2. Current Assets", currentAssets, false, true, 1),
    createItem("a. Current Investments", currentInvestments, true, false, 2),
    createItem("b. Inventories", inventories, true, false, 2),
    createItem("c. Trade Receivables", tradeReceivables, true, false, 2),
    createItem("d. Cash & Cash Equivalents", cashEquivalents, true, false, 2),
    createItem("e. Short-term Loans & Advances", shortTermLoansAdvances, true, false, 2),
    createItem("f. Other Current Assets", otherCurrentAssets, true, false, 2),
  ];

  return {
    equityAndLiabilities: {
      title: "Equity & Liabilities",
      items: equityAndLiabilitiesItems,
      total: createItem("TOTAL LIABILITIES", totalLiabilities, false, true),
    },
    assets: {
      title: "Assets",
      items: assetsItems,
      total: createItem("TOTAL ASSETS", totalAssets, false, true),
    },
  };
}

// Interface for formal P&L statement line items
interface FormalPLLineItem {
  label: string
  currentYear: number
  previousYear?: number
  variance?: number
  variancePercent?: number
  isSubTotal?: boolean
  isTotal?: boolean
  level: number // 0 = main heading, 1 = sub-item, 2 = sub-sub-item
}

// Function to get formal P&L statement data matching the image format
export function getFormalPLStatementData(dataSource: 'sez' | 'non-sez' | 'combined' = 'combined'): FormalPLLineItem[] {
  let data: TextronLedgerEntry[]
  
  switch (dataSource) {
    case 'sez':
      data = getSezData()
      break
    case 'non-sez':
      data = getNonSezData()
      break
    default:
      data = getCombinedData()
  }

  // Helper function to get amount by FS Sub Line
  const getAmountByFSSubLine = (fsSubLine: string): number => {
    return data
      .filter(entry => entry["fs_sub_line"] === fsSubLine && (entry.type === 'Income' || entry.type === 'Expense'))
      .reduce((sum, entry) => sum + Math.abs(entry["closing_balance"]), 0)
  }

  // Helper function to get amount by Note Line
  const getAmountByNoteLine = (noteLine: string): number => {
    return data
      .filter(entry => entry["note_line"] === noteLine && (entry.type === 'Income' || entry.type === 'Expense'))
      .reduce((sum, entry) => sum + Math.abs(entry["closing_balance"]), 0)
  }

  // Use Formula.json data for P&L components
  const plData = formulaData["PL-AS"]
  
  // Calculate main components using Formula.json data when available
  const revenueFromOperations = Math.abs(plData["Revenue from Operations"] || 0)
  const otherIncome = Math.abs(plData["Other Income"] || 0)
  const totalRevenue = Math.abs(plData["TOTAL REVENUE"] || 0)

  const costOfMaterialsConsumed = Math.abs(plData["Cost of materials consumed"] || 0)
  const purchasesOfStockInTrade = Math.abs(plData["Purchases of stock-in-trade"] || 0)
  const changesInInventories = Math.abs(plData["Changes in inventories of finished goods, work-in-progress and stock-in-trade"] || 0)
  const employeeBenefitsExpense = Math.abs(plData["Employee benefits expense"] || 0)
  const financeCosts = Math.abs(plData["Finance costs"] || 0)
  const depreciationAndAmortisation = Math.abs(plData["Depreciation and amortisation expense"] || 0)
  const otherExpenses = Math.abs(plData["Other Expenses"] || 0)

  const totalExpenses = Math.abs(plData["TOTAL EXPENSES"] || 0)

  const profitBeforeExceptionalItems = Math.abs(plData["PROFIT BEFORE EXCEPTIONAL ITEMS, EXTRAORDINARY ITEMS AND TAX"] || 0)
  
  // Get exceptional items
  const exceptionalItems = Math.abs(plData["Exceptional Items"] || 0)
  
  const profitBeforeExtraordinaryItems = Math.abs(plData["PROFIT BEFORE EXTRAORDINARY ITEMS AND TAX"] || 0)
  
  // Get extraordinary items
  const extraordinaryItems = Math.abs(plData["Extraordinary Items"] || 0)
  
  const profitBeforeTax = Math.abs(plData["PROFIT BEFORE TAX"] || 0)
  
  // Get tax expense
  const currentTax = Math.abs(plData["Current tax"] || 0)
  const deferredTax = Math.abs(plData["Deferred tax"] || 0)
  const totalTaxExpense = Math.abs(plData["TAX EXPENSE"] || 0)
  
  const profitForThePeriod = Math.abs(plData["PROFIT/(LOSS) FOR THE PERIOD"] || 0)

  // Create the formal P&L structure
  const plStatementData: FormalPLLineItem[] = [
    // Revenue Section
    { label: "I. Revenue from Operations", currentYear: revenueFromOperations, level: 0 },
    { label: "II. Other Income", currentYear: otherIncome, level: 0 },
    { label: "III. TOTAL REVENUE", currentYear: totalRevenue, level: 0, isTotal: true },
    
    // Expenses Section
    { label: "IV. EXPENSES", currentYear: 0, level: 0 },
    { label: "Cost of materials consumed", currentYear: costOfMaterialsConsumed, level: 1 },
    { label: "Purchases of stock-in-trade", currentYear: purchasesOfStockInTrade, level: 1 },
    { label: "Changes in inventories of finished goods, work-in-progress and stock-in-trade", currentYear: changesInInventories, level: 1 },
    { label: "Employee benefits expense", currentYear: employeeBenefitsExpense, level: 1 },
    { label: "Finance costs", currentYear: financeCosts, level: 1 },
    { label: "Depreciation and amortisation expense", currentYear: depreciationAndAmortisation, level: 1 },
    { label: "Other Expenses", currentYear: otherExpenses, level: 1 },
    { label: "TOTAL EXPENSES", currentYear: totalExpenses, level: 0, isTotal: true },
    
    // Profit calculations
    { label: "V. PROFIT BEFORE EXCEPTIONAL ITEMS, EXTRAORDINARY ITEMS AND TAX (III-IV)", currentYear: profitBeforeExceptionalItems, level: 0, isTotal: true },
    { label: "VI. EXCEPTIONAL ITEMS", currentYear: exceptionalItems, level: 0 },
    { label: "VII. PROFIT BEFORE EXTRAORDINARY ITEMS AND TAX (V-VI)", currentYear: profitBeforeExtraordinaryItems, level: 0, isTotal: true },
    { label: "VIII. EXTRAORDINARY ITEMS", currentYear: extraordinaryItems, level: 0 },
    { label: "IX. PROFIT BEFORE TAX (VII-VIII)", currentYear: profitBeforeTax, level: 0, isTotal: true },
    
    // Tax Section
    { label: "X. TAX EXPENSE", currentYear: 0, level: 0 },
    { label: "1. Current tax", currentYear: currentTax, level: 1 },
    { label: "2. Deferred tax", currentYear: deferredTax, level: 1 },
    { label: "", currentYear: totalTaxExpense, level: 0, isTotal: true }, // Total tax line
    
    // Final Result
    { label: "XI. PROFIT/(LOSS) FOR THE PERIOD", currentYear: profitForThePeriod, level: 0, isTotal: true }
  ]

  return plStatementData
}

export type { FinancialRatio, YearlyFinancialData, EnhancedTrialBalanceEntry, MappingViewWithoutAmounts, MappingViewWithAmounts, FormalPLLineItem } 
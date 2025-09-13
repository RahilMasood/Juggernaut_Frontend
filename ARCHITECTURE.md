# Accounting Desktop Application - Architecture Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Application Structure](#application-structure)
5. [Core Components](#core-components)
6. [Data Layer](#data-layer)
7. [IPC Communication](#ipc-communication)
8. [Payroll Module Architecture](#payroll-module-architecture)
9. [State Management](#state-management)
10. [Routing System](#routing-system)
11. [Build and Deployment](#build-and-deployment)
12. [Security Considerations](#security-considerations)
13. [Performance Optimization](#performance-optimization)

## Project Overview

The Accounting Desktop Application is a comprehensive Electron-based desktop application designed for financial professionals. It provides advanced financial reporting, audit planning workflows, payroll management, and data analysis capabilities.

### Key Features

- **Financial Reporting**: Balance sheets, profit & loss statements, trial balances, financial ratios
- **Audit Planning**: Materiality assessment, fraud risk analysis, audit workflow management
- **Payroll Management**: End-to-end payroll processing with ROMMS compliance
- **Document Management**: Secure document upload, storage, and organization
- **Data Visualization**: Interactive charts and analytical dashboards
- **Multi-language Support**: Internationalization with i18next

## Technology Stack

### Frontend Framework

- **React 19**: Latest React with concurrent features and hooks
- **TypeScript**: Type-safe development with strict typing
- **Vite**: Fast build tool with HMR (Hot Module Replacement)

### Desktop Framework

- **Electron 36**: Cross-platform desktop application framework
- **Electron Forge**: Build and packaging toolchain
- **ContextBridge**: Secure IPC communication between main and renderer processes

### UI/UX Layer

- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: High-quality React component library
- **Lucide React**: Beautiful and consistent icon library
- **Recharts**: Data visualization library
- **React PDF**: PDF processing and display capabilities

### State Management

- **TanStack Query**: Server state management for API calls
- **React Context**: Local component state management
- **Zod**: Runtime type validation and schema definition

### Development Tools

- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting
- **Vitest**: Fast unit testing framework
- **Playwright**: End-to-end testing
- **TypeScript ESLint**: TypeScript-specific linting

### Build Tools

- **Bun**: Fast JavaScript runtime and package manager (preferred)
- **Electron Forge**: Application packaging and distribution
- **Vite Plugin React**: React integration for Vite

## Architecture Patterns

### 1. Feature-Based Organization

The application follows a feature-based folder structure where related components, hooks, utilities, and types are grouped together:

```
src/components/
├── planning/           # Audit planning features
├── payroll/           # Payroll management features
├── documents/         # Document management features
└── ui/               # Shared UI components
```

### 2. Component Composition Pattern

- **Container/Presentational Pattern**: Separation of data fetching (containers) from presentation logic
- **Custom Hooks**: Business logic abstracted into reusable hooks
- **Compound Components**: Related components composed together for complex UI patterns

### 3. IPC Abstraction Layer

Clean separation between main and renderer processes through:

- **Context Bridge**: Secure API exposure from main to renderer
- **Typed IPC Channels**: Strongly typed communication channels
- **Error Handling**: Comprehensive error handling for IPC calls

### 4. Data Processing Pipeline

- **Data Transformation Layer**: Raw data processing and formatting
- **Formula Engine**: Financial calculations using predefined formulas
- **Validation Layer**: Input validation using Zod schemas

### 5. Route Configuration Pattern

- **Centralized Routing**: All routes defined in a single configuration file
- **Dynamic Component Loading**: Components loaded based on route configuration
- **Nested Routes**: Support for complex nested routing structures

## Application Structure

### Directory Structure

```
src/
├── components/           # React components
│   ├── ui/              # Design system components
│   ├── planning/        # Audit planning workflow
│   ├── payroll/         # Payroll management
│   ├── documents/       # Document management
│   └── main-content.tsx # Main content router
├── helpers/             # Utility functions and IPC
│   ├── ipc/            # Inter-Process Communication
│   └── *-helper.ts     # Feature-specific utilities
├── lib/                # Business logic and data processing
├── pages/              # Route-based page components
├── routes/             # Router configuration
├── types/              # TypeScript type definitions
├── utils/              # Shared utilities
├── constants/          # Application constants
├── data/               # Static data files
├── localization/       # Internationalization files
├── main.ts             # Electron main process
├── preload.ts          # Preload script for IPC
├── renderer.ts         # Renderer process entry
└── styles/             # Global styles and themes
```

### Electron Architecture

```
┌─────────────────┐    IPC     ┌─────────────────┐
│   Main Process  │◄──────────►│ Renderer Process│
│   (Node.js)     │            │   (React)       │
│                 │            │                 │
│ • Window Mgmt   │            │ • UI Components │
│ • File System   │            │ • State Mgmt    │
│ • Native APIs   │            │ • Routing       │
│ • IPC Handlers  │            │ • Data Processing│
└─────────────────┘            └─────────────────┘
```

## Core Components

### 1. Main Application Layout

```typescript
// src/pages/HomePage.tsx
function HomePage() {
  return (
    <div className="flex h-screen">
      <TopHeader />           // Global navigation and search
      <LeftPanel />           // Navigation sidebar
      <MainContent />         // Dynamic content area
      <DocumentSidebar />     // Document management panel
    </div>
  );
}
```

### 2. Content Routing System

```typescript
// src/components/main-content-routes.tsx
export const mainContentRoutes: Record<string, RouteConfig> = {
  overview: { component: OverviewSection },
  "balance-sheet": { component: BalanceSheetSection },
  "financial-ratios": { component: FinancialRatiosSection },
  // ... more routes
};
```

### 3. Component Hierarchy

```
HomePage
├── TopHeader (Search, Document Toggle)
├── LeftPanel (Navigation Menu)
├── MainContent (Dynamic Content Router)
│   ├── OverviewSection
│   ├── BalanceSheetSection
│   ├── ProfitLossSection
│   ├── ChartsSection
│   └── PlanningWorkflow
└── DocumentSidebar (Document Management)
```

## Data Layer

### 1. Data Sources

The application processes multiple data formats:

- **JSON Files**: Static financial data and formulas
- **Excel Files**: Payroll and financial spreadsheets
- **CSV Files**: Transaction data and reports
- **PDF Files**: Document storage and processing

### 2. Data Processing Architecture

```typescript
// src/lib/textron-data-processor.ts
interface TextronLedgerEntry {
  ledger_name: string;
  opening_balance: number;
  closing_balance: number;
  type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
  fs_line: string;
  fs_sub_line: string;
  // ... additional fields
}

export function processTextronData(dataSource: DataSource): FinancialMetrics {
  // Data processing pipeline
  const rawData = loadData(dataSource);
  const processedData = transformData(rawData);
  const metrics = calculateMetrics(processedData);
  return metrics;
}
```

### 3. Financial Calculations

The application uses a formula-based calculation system:

- **Formula.json**: Predefined calculation formulas
- **Dynamic Calculations**: Runtime financial metric calculations
- **Multi-year Analysis**: Historical data comparison
- **Ratio Analysis**: Financial ratio calculations with metadata

### 4. Data Flow

```
Raw Data → Validation → Processing → Calculation → Presentation
    ↓         ↓           ↓           ↓            ↓
 JSON/XLSX   Zod        Transform   Formula      Charts
   CSV       Schema      Filter     Engine      Tables
   PDF       Types       Sort       Ratios     Reports
```

## IPC Communication

### 1. IPC Channel Architecture

```typescript
// Channel naming convention: {feature}:{action}
export const THEME_MODE_TOGGLE_CHANNEL = "theme-mode:toggle";
export const WINDOW_MINIMIZE_CHANNEL = "window:minimize";
export const PAYROLL_RUN_CHANNEL = "payroll:run";
```

### 2. Context Bridge API

```typescript
// src/helpers/ipc/theme/theme-context.ts
export function exposeThemeContext() {
  contextBridge.exposeInMainWorld("themeMode", {
    current: () => ipcRenderer.invoke(THEME_MODE_CURRENT_CHANNEL),
    toggle: () => ipcRenderer.invoke(THEME_MODE_TOGGLE_CHANNEL),
    dark: () => ipcRenderer.invoke(THEME_MODE_DARK_CHANNEL),
    light: () => ipcRenderer.invoke(THEME_MODE_LIGHT_CHANNEL),
    system: () => ipcRenderer.invoke(THEME_MODE_SYSTEM_CHANNEL),
  });
}
```

### 3. IPC Handler Pattern

```typescript
// src/helpers/ipc/theme/theme-listeners.ts
export function addThemeEventListeners() {
  ipcMain.handle(THEME_MODE_CURRENT_CHANNEL, () => nativeTheme.themeSource);
  ipcMain.handle(THEME_MODE_TOGGLE_CHANNEL, () => {
    nativeTheme.themeSource = nativeTheme.shouldUseDarkColors
      ? "light"
      : "dark";
    return nativeTheme.shouldUseDarkColors;
  });
}
```

### 4. Error Handling in IPC

```typescript
// Robust error handling pattern
try {
  const result = await window.electronAPI.someMethod();
} catch (error) {
  console.error("IPC call failed:", error);
  // Fallback or error recovery logic
}
```

## Payroll Module Architecture

### 1. Payroll Execution Flow

```
Payroll Landing → Script Selection → File Upload → Execution → Results
     ↓                ↓                ↓            ↓          ↓
  Categories     Python Scripts    Input Files   Progress   Download
  (RoMMs,        (IPE Testing,     (Excel,       Tracking   Results
   Controls,     Exception         CSV, JSON)    Status     Files
   Substantive)  Testing, etc.)
```

### 2. Python Script Integration

```typescript
// src/components/payroll/PayrollRunner.tsx
const SCRIPTS = [
  { key: "ipe_testing", label: "IPE Testing" },
  { key: "exception_testing", label: "Exception Testing" },
  { key: "headcount_reconciliation", label: "Headcount Reconciliation" },
  // ... additional scripts
];

const runPayrollScript = async (scriptKey: string, inputFiles: string[]) => {
  const result = await window.payroll.run(scriptKey, { inputFiles });
  return result;
};
```

### 3. Document Management

```typescript
// src/components/payroll/PayrollDocumentsContext.tsx
interface PayrollDocument {
  id: string;
  fileName: string;
  filePath: string;
  extension: string;
  uploadedAt: Date;
}

const PayrollDocumentsContext = createContext<{
  documents: PayrollDocument[];
  addDocumentsByPaths: (paths: string[]) => void;
  removeDocument: (id: string) => void;
} | null>(null);
```

### 4. Progress Tracking

```typescript
// Real-time progress updates via IPC
useEffect(() => {
  const unsubscribe = window.payroll.onProgress((progress) => {
    setProgress({
      progress: progress.progress,
      status: progress.status,
      message: progress.message,
      error: progress.error,
    });
  });
  return unsubscribe;
}, []);
```

## State Management

### 1. Local State (React Hooks)

```typescript
// Component-level state management
const [activeSection, setActiveSection] = useState("overview");
const [searchTerm, setSearchTerm] = useState("");
const [documents, setDocuments] = useState<Document[]>([]);
```

### 2. Server State (TanStack Query)

```typescript
// API data management with caching
const useFinancialData = (companyId: string) => {
  return useQuery({
    queryKey: ["financial-data", companyId],
    queryFn: () => fetchFinancialData(companyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### 3. Global State (Context)

```typescript
// Theme context for dark/light mode
const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
});

// Document context for file management
const DocumentContext = createContext<DocumentContextType>({
  documents: [],
  addDocument: () => {},
  removeDocument: () => {},
});
```

### 4. Form State Management

```typescript
// Complex form state with validation
const [formData, setFormData] = useState<FormData>({
  name: "",
  email: "",
  amount: 0,
});

// Reducer pattern for complex state transitions
const [state, dispatch] = useReducer(formReducer, initialState);
```

## Routing System

### 1. Router Configuration

```typescript
// src/routes/router.tsx
const history = createMemoryHistory({
  initialEntries: ["/"],
});

export const router = createRouter({
  routeTree: rootTree,
  history: history,
});
```

### 2. Route Definitions

```typescript
// src/routes/routes.tsx
export const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: HomePage,
});

export const PayrollModuleRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/payroll/$moduleId",
  component: PayrollModulePage,
});
```

### 3. Nested Routing

```typescript
// Root route with nested children
export const RootRoute = createRootRoute({
  component: () => (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  ),
});

export const rootTree = RootRoute.addChildren([
  HomeRoute,
  PayrollModuleRoute,
]);
```

### 4. In-Memory Routing

The application uses memory history for Electron's single-page application nature, avoiding browser URL manipulation and providing better control over navigation state.

## Build and Deployment

### 1. Development Workflow

```bash
# Development server with hot reload
bun run start

# Production build
bun run make

# Testing suite
bun run test:all
```

### 2. Build Configuration

```typescript
// vite.main.config.ts - Main process build
export default defineConfig({
  plugins: [plugin()],
  build: {
    entry: "src/main.ts",
    target: "node18",
    outDir: "dist-main",
  },
});

// vite.renderer.config.mts - Renderer process build
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist-renderer",
  },
});
```

### 3. Electron Forge Configuration

```typescript
// forge.config.ts
export default {
  packagerConfig: {
    name: "Accounting Desktop",
    executableName: "accounting-desktop",
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: { name: "accounting_desktop" },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux"],
    },
  ],
};
```

### 4. Distribution Platforms

- **macOS**: `.dmg` packages
- **Windows**: `.exe` installers via Squirrel
- **Linux**: `.deb` and `.rpm` packages

## Security Considerations

### 1. IPC Security

- **Context Isolation**: Enabled to prevent script injection
- **Node Integration**: Disabled in renderer process
- **Secure Context Bridge**: Only expose necessary APIs

### 2. File Handling

- **Path Validation**: All file paths validated before processing
- **Type Restrictions**: Limited to allowed file types
- **Size Limits**: File size restrictions to prevent abuse

### 3. Data Protection

- **Input Validation**: Zod schemas for all user inputs
- **Sanitization**: HTML and data sanitization
- **Secure Storage**: Sensitive data encrypted at rest

### 4. Network Security

- **HTTPS Only**: All external requests use HTTPS
- **CORS Policy**: Strict CORS configuration
- **Rate Limiting**: API request rate limiting

## Performance Optimization

### 1. Bundle Optimization

- **Code Splitting**: Dynamic imports for large components
- **Tree Shaking**: Remove unused code automatically
- **Asset Optimization**: Image and font optimization

### 2. React Performance

- **Memoization**: `React.memo`, `useMemo`, `useCallback`
- **Virtual Scrolling**: For large data tables
- **Lazy Loading**: Components loaded on demand

### 3. Data Processing

- **Pagination**: Large datasets processed in chunks
- **Caching**: Query result caching with TanStack Query
- **Background Processing**: Heavy calculations in web workers

### 4. Memory Management

- **Cleanup**: Event listeners and subscriptions properly cleaned up
- **Resource Disposal**: File handles and streams properly closed
- **Garbage Collection**: Manual cleanup for large objects

## Conclusion

This architecture documentation provides a comprehensive overview of the Accounting Desktop Application's structure, patterns, and implementation details. The application follows modern React and Electron best practices, with a focus on maintainability, performance, and user experience.

Key architectural strengths:

- **Modular Design**: Feature-based organization enables easy maintenance
- **Type Safety**: Comprehensive TypeScript usage prevents runtime errors
- **Security**: Proper IPC isolation and input validation
- **Performance**: Optimized rendering and data processing
- **Scalability**: Clean separation of concerns allows for future expansion

The codebase demonstrates enterprise-level software development practices suitable for financial applications requiring high reliability and data integrity.

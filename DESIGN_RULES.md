# Design Rules & Technical Guidelines

This document outlines the technical design principles, coding standards, and architectural patterns for the Accounting Desktop Application.

## Coding Standards

### TypeScript Guidelines

#### Type Definitions

```typescript
// ✅ Good: Explicit types for complex objects
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ✅ Good: Union types for constrained values
type UserRole = "admin" | "auditor" | "accountant";

// ❌ Avoid: Generic any types
function processData(data: any) {
  /* ... */
}

// ✅ Good: Proper typing
function processData<T extends BaseData>(data: T): ProcessedData {
  /* ... */
}
```

#### Function Signatures

```typescript
// ✅ Good: Clear parameter names and return types
function calculateMateriality(
  financialData: FinancialData,
  benchmark: MaterialityBenchmark,
): MaterialityResult {
  // Implementation
}

// ✅ Good: Optional parameters with defaults
function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale?: string,
): string {
  // Implementation
}
```

### React Component Patterns

#### Component Structure

```typescript
// ✅ Good: Named export with clear interface
interface ComponentProps {
  data: DataType;
  onAction: (action: ActionType) => void;
}

export function DataProcessor({ data, onAction }: ComponentProps) {
  // Component logic
}

// ✅ Good: Custom hooks for complex logic
function useDataProcessor(data: DataType) {
  const [state, setState] = useState<ProcessorState>({
    /* ... */
  });

  const process = useCallback(() => {
    // Processing logic
  }, [data]);

  return { state, process };
}
```

#### State Management

```typescript
// ✅ Good: Local state with proper typing
const [formData, setFormData] = useState<FormData>({
  name: "",
  email: "",
  amount: 0,
});

// ✅ Good: Reducer for complex state transitions
const [state, dispatch] = useReducer(formReducer, initialState);

// ✅ Good: Server state with TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ["financial-data", companyId],
  queryFn: () => fetchFinancialData(companyId),
});
```

### File Naming & Structure

#### Component Files

```
components/
├── ui/                    # Base UI components
│   ├── button.tsx        # ✅ Good: kebab-case for multi-word
│   ├── data-table.tsx
│   └── modal-dialog.tsx
├── planning/             # Feature-specific components
│   ├── materiality-section.tsx
│   ├── hooks/           # Custom hooks
│   │   └── use-materiality-data.ts
│   └── components/      # Sub-components
│       └── materiality-summary.tsx
```

#### Utility Files

```
utils/
├── logger.ts            # ✅ Good: Single responsibility
├── date-helpers.ts      # ✅ Good: Feature-specific utilities
└── validation.ts
```

## Component Design Guidelines

### Reusable Components

```typescript
// ✅ Good: Configurable component with clear API
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

### Container/Presentational Pattern

```typescript
// ✅ Good: Container handles data, presentational handles UI
function FinancialDataContainer() {
  const { data, isLoading } = useFinancialData();

  if (isLoading) return <LoadingSpinner />;

  return <FinancialDataTable data={data} />;
}

interface FinancialDataTableProps {
  data: FinancialData[];
}

function FinancialDataTable({ data }: FinancialDataTableProps) {
  return (
    <Table>
      {/* Pure presentation logic */}
    </Table>
  );
}
```

## File Naming & Structure Guide

### Directory Structure

```
src/
├── components/           # React components
│   ├── ui/              # Design system components
│   ├── feature-name/    # Feature-specific components
│   └── shared/          # Shared components
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── lib/                 # Business logic & utilities
├── utils/               # Pure utility functions
├── types/               # TypeScript definitions
├── constants/           # Application constants
└── styles/              # Global styles & themes
```

### Naming Conventions

#### Files & Directories

- **kebab-case**: `materiality-planning.tsx`, `financial-ratios/`
- **PascalCase**: Component files when they export a component
- **camelCase**: Utility files, hooks, constants

#### Variables & Functions

- **camelCase**: `userName`, `calculateTotal()`
- **PascalCase**: Components, Types, Interfaces
- **UPPER_SNAKE_CASE**: Constants, Environment variables

#### Components

```typescript
// ✅ Good: Descriptive component names
export function MaterialityAssessment() {
  /* ... */
}
export function FinancialReportTable() {
  /* ... */
}

// ❌ Avoid: Generic names
export function Table() {
  /* ... */
} // Too generic
export function Data() {
  /* ... */
} // Not descriptive
```

## State Management Strategy

### Local State

```typescript
// ✅ Good: Simple boolean/number state
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);

// ✅ Good: Form state
const [formData, setFormData] = useState<FormData>(initialData);
```

### Complex State

```typescript
// ✅ Good: Reducer for complex state
type State = {
  data: Data[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Data[] }
  | { type: "FETCH_ERROR"; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, data: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
```

### Server State

```typescript
// ✅ Good: TanStack Query for server state
const useFinancialData = (companyId: string) => {
  return useQuery({
    queryKey: ["financial-data", companyId],
    queryFn: () => api.getFinancialData(companyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

## API Design Rules

### REST API Patterns

```typescript
// ✅ Good: Consistent API structure
interface ApiResponse<T> {
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
  };
  success: boolean;
  message?: string;
}

// ✅ Good: Resource-based endpoints
const endpoints = {
  companies: "/api/companies",
  companyById: (id: string) => `/api/companies/${id}`,
  financialData: (companyId: string) =>
    `/api/companies/${companyId}/financial-data`,
} as const;
```

### Request/Response Shape

```typescript
// ✅ Good: Consistent request structure
interface ApiRequest {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

// ✅ Good: Error handling
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

### GraphQL (Future)

```typescript
// Future GraphQL patterns
interface GraphQLResponse<T> {
  data: T;
  errors?: GraphQLError[];
}
```

## Testing Strategy

### Unit Tests

```typescript
// ✅ Good: Test business logic
describe('calculateMateriality', () => {
  it('should calculate correct materiality for revenue benchmark', () => {
    const result = calculateMateriality({
      revenue: 1000000,
      benchmark: 'revenue',
      percentage: 5,
    });

    expect(result.materiality).toBe(50000);
  });
});

// ✅ Good: Test component behavior
describe('MaterialitySection', () => {
  it('should render planning tab by default', () => {
    render(<MaterialitySection />);
    expect(screen.getByText('Planning')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// ✅ Good: Test component interactions
describe('Audit Workflow', () => {
  it('should complete materiality assessment flow', async () => {
    render(<PlanningWorkflow />);

    // Navigate through tabs
    await userEvent.click(screen.getByText('Planning'));
    // Fill form...
    await userEvent.click(screen.getByText('Revision'));
    // Verify completion...
  });
});
```

### E2E Tests

```typescript
// ✅ Good: Test critical user journeys
test("complete audit planning workflow", async ({ page }) => {
  await page.goto("/");

  // Navigate to planning section
  await page.click('[data-testid="planning-section"]');

  // Complete materiality assessment
  await page.fill('[data-testid="revenue-input"]', "1000000");
  await page.click('[data-testid="calculate-button"]');

  // Verify results
  await expect(
    page.locator('[data-testid="materiality-result"]'),
  ).toContainText("50000");
});
```

## Error Handling Approach

### Error Types

```typescript
// ✅ Good: Typed errors
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}
```

### Error Boundaries

```typescript
// ✅ Good: React error boundaries
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary', error, 'ERROR_BOUNDARY');
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Error Handling Patterns

```typescript
// ✅ Good: Graceful error handling
async function fetchFinancialData(companyId: string) {
  try {
    const response = await api.get(`/companies/${companyId}/financial-data`);

    if (!response.success) {
      throw new ApiError(response.message);
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      logger.warn("API Error", error.message, "API");
      throw error;
    }

    logger.error("Unexpected error", error, "API");
    throw new NetworkError("Failed to fetch financial data");
  }
}
```

## Security Guidelines

### Input Validation

```typescript
// ✅ Good: Zod schemas for validation
import { z } from "zod";

const UserInputSchema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  description: z.string().max(500),
});

export function validateUserInput(input: unknown) {
  return UserInputSchema.parse(input);
}
```

### File Upload Security

```typescript
// ✅ Good: Secure file handling
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): boolean {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return false;
  }

  if (file.size > MAX_SIZE) {
    return false;
  }

  return true;
}
```

### Data Sanitization

```typescript
// ✅ Good: Sanitize user inputs
import DOMPurify from "dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em"],
    ALLOWED_ATTR: [],
  });
}
```

### Secrets Management

```typescript
// ✅ Good: Environment variables for secrets
const config = {
  apiKey: process.env.VITE_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
};

// ❌ Avoid: Hardcoded secrets
const API_KEY = "sk-1234567890abcdef";
```

## Performance Guidelines

### Component Optimization

```typescript
// ✅ Good: Memoization for expensive operations
const ExpensiveComponent = React.memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  return <div>{processedData}</div>;
});
```

### Bundle Optimization

```typescript
// ✅ Good: Code splitting
const FinancialReports = lazy(() => import("./components/FinancialReports"));

// ✅ Good: Tree shaking friendly imports
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
```

### Memory Management

```typescript
// ✅ Good: Cleanup subscriptions
useEffect(() => {
  const subscription = dataService.subscribe(handleUpdate);

  return () => {
    subscription.unsubscribe();
  };
}, []);

// ✅ Good: Event listener cleanup
useEffect(() => {
  const handleResize = () => {
    /* ... */
  };
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);
```

## Accessibility Guidelines

### Semantic HTML

```typescript
// ✅ Good: Proper semantic elements
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/reports">Reports</a></li>
  </ul>
</nav>

// ✅ Good: Form accessibility
<form onSubmit={handleSubmit}>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-help"
    required
  />
  <span id="email-help">We'll never share your email</span>
  <button type="submit">Submit</button>
</form>
```

### Keyboard Navigation

```typescript
// ✅ Good: Keyboard accessible components
function DropdownMenu({ children, ...props }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      role="menu"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
}
```

## Internationalization

### Translation Keys

```typescript
// ✅ Good: Structured translation keys
const translations = {
  navigation: {
    dashboard: "Dashboard",
    reports: "Reports",
    settings: "Settings",
  },
  forms: {
    save: "Save",
    cancel: "Cancel",
    errors: {
      required: "This field is required",
      invalidEmail: "Please enter a valid email",
    },
  },
};
```

### Date/Number Formatting

```typescript
// ✅ Good: Localized formatting
import { useTranslation } from "react-i18next";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(i18n.language).format(date);
}
```

This document serves as a living guide for maintaining code quality and consistency across the Accounting Desktop Application. All team members should familiarize themselves with these guidelines and apply them in their daily development work.

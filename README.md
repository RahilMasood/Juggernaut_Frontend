# Accounting Desktop Application

A comprehensive Electron-based desktop application for accounting and financial analysis, built with React, TypeScript, and modern web technologies.

## Project Overview

This application provides a complete suite of accounting and auditing tools designed for financial professionals. It offers advanced financial reporting, audit planning workflows, payroll management, and comprehensive data analysis capabilities.

### Key Features

- **Financial Reporting**: Balance sheets, profit & loss statements, trial balances, and financial ratios
- **Audit Planning**: Comprehensive materiality assessment, fraud risk analysis, and audit workflow management
- **Payroll Management**: End-to-end payroll processing with ROMMS (Reliability, Obedience, Management, Measurement, Security) compliance
- **Document Management**: Secure document upload, storage, and organization
- **Data Visualization**: Interactive charts and analytical dashboards
- **Multi-language Support**: Internationalization with i18next

## Architecture Overview

### Technology Stack

- **Frontend**: React 19 with TypeScript
- **Desktop Framework**: Electron with Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React Context for local state
- **Routing**: TanStack Router
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright
- **Package Manager**: Bun (preferred) / npm

### Folder Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── planning/        # Audit planning workflow components
│   ├── payroll/         # Payroll management components
│   ├── documents/       # Document management components
│   └── ...
├── helpers/             # Utility functions and IPC communication
│   ├── ipc/            # Inter-Process Communication handlers
│   └── *-helper.ts     # Feature-specific utilities
├── lib/                # Core business logic and data processing
├── pages/              # Route-based page components
├── routes/             # Router configuration
├── types/              # TypeScript type definitions
├── utils/              # Shared utilities and helpers
├── constants/          # Application constants and configuration
├── data/               # Static data files
└── localization/       # Internationalization files
```

### Design Patterns

- **Component Composition**: Modular, reusable React components
- **Custom Hooks**: Business logic abstracted into reusable hooks
- **Route Configuration**: Centralized route management with dynamic component loading
- **IPC Abstraction**: Clean separation between main and renderer processes
- **Feature-based Organization**: Components grouped by business domain

## Setup Instructions

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accountingDesktop
   ```

2. **Install dependencies**
   ```bash
   # Using Bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   # Using Bun
   bun run start

   # Or using npm
   npm run start
   ```

### Development Workflow

```bash
# Start development server
bun run start

# Run tests
bun run test

# Run linting
bun run lint

# Format code
bun run format

# Build for production
bun run make
```

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Application Configuration
NODE_ENV=development
VITE_APP_NAME="Accounting Desktop"

# Database Configuration (if applicable)
DB_PATH=./data/app.db

# API Configuration
API_BASE_URL=http://localhost:3001

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_PAYROLL_MODULE=true
ENABLE_DOCUMENT_MANAGEMENT=true
```

## Build & Deployment

### Development Build

```bash
bun run package
```

### Production Build

```bash
bun run make
```

This creates distributable packages for:
- macOS (.dmg)
- Windows (.exe)
- Linux (.deb, .rpm)

### CI/CD Pipeline

The project includes GitHub Actions workflows for:
- Automated testing on pull requests
- Release builds on tag pushes
- Code quality checks

## Tech Stack Details

### Frontend Framework
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool with HMR

### Desktop Integration
- **Electron**: Cross-platform desktop app framework
- **Electron Forge**: Build and packaging tool

### UI/UX
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Lucide React**: Beautiful icon library
- **Recharts**: Data visualization library

### State & Data
- **TanStack Query**: Server state management
- **Zod**: Runtime type validation
- **PDF.js**: PDF processing and display

### Development Tools
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting
- **Vitest**: Fast unit testing
- **Playwright**: End-to-end testing
- **TypeScript ESLint**: TypeScript-specific linting

## Common Pitfalls & Gotchas

### Development Issues

1. **IPC Communication**: Ensure proper error handling for main/renderer communication
   ```typescript
   // Good
   try {
     const result = await window.electronAPI.someMethod();
   } catch (error) {
     console.error('IPC call failed:', error);
   }
   ```

2. **File Paths**: Use absolute paths for file operations
   ```typescript
   // Good
   const filePath = path.resolve(__dirname, 'data', 'file.json');
   ```

3. **Memory Management**: Clean up event listeners and subscriptions
   ```typescript
   useEffect(() => {
     const unsubscribe = someSubscription();
     return unsubscribe;
   }, []);
   ```

### Performance Considerations

1. **Large Datasets**: Implement pagination for large financial datasets
2. **PDF Processing**: Use web workers for heavy PDF operations
3. **Component Re-rendering**: Memoize expensive calculations

### Security Best Practices

1. **Input Validation**: Always validate user inputs using Zod schemas
2. **File Upload**: Restrict file types and scan for malware
3. **Data Encryption**: Encrypt sensitive financial data at rest

## Contributing Guide

### Branching Strategy

We follow Git Flow:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `release/*`: Release preparation

### Commit Convention

Use Conventional Commits:
```bash
feat: add new materiality calculation feature
fix: resolve PDF rendering issue in Firefox
docs: update API documentation
refactor: simplify component structure
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes with descriptive commits
3. Ensure tests pass and code is linted
4. Create PR with detailed description
5. Request review from maintainers
6. Merge after approval

### Code Review Checklist

- [ ] Tests added/updated
- [ ] Code follows TypeScript best practices
- [ ] No console.log statements in production code
- [ ] Proper error handling
- [ ] Documentation updated
- [ ] Performance impact considered

## Testing Strategy

### Unit Tests
```bash
bun run test:unit
```
- Component testing with Testing Library
- Utility function testing
- Business logic validation

### End-to-End Tests
```bash
bun run test:e2e
```
- Critical user workflows
- Cross-platform compatibility
- Integration testing

### Test Coverage
- Minimum 80% coverage required
- Focus on business logic and user interactions
- CI pipeline enforces coverage thresholds

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules bun.lock
   bun install
   ```

2. **Electron Development Issues**
   ```bash
   # Reset Electron cache
   bun run start -- --reset-cache
   ```

3. **TypeScript Errors**
   ```bash
   # Check TypeScript compilation
   bun run tsc --noEmit
   ```

### Debug Mode

Enable debug logging:
```bash
DEBUG=accounting:* bun run start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review existing issues for similar problems

## Roadmap

### Upcoming Features
- [ ] Advanced reporting dashboard
- [ ] Multi-company support
- [ ] API integration with accounting software
- [ ] Mobile companion app
- [ ] Advanced audit analytics

### Version History
- **v1.0.0**: Initial release with core accounting features
- **v1.1.0**: Enhanced audit planning workflows
- **v1.2.0**: Payroll module integration

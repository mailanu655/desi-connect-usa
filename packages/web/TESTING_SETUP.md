# Testing Infrastructure Setup

The testing infrastructure for the Next.js web package has been successfully configured.

## Files Created

1. **jest.config.js** - Jest configuration file
   - Uses Next.js jest helper for proper Next.js support
   - Configured for jsdom test environment
   - Path alias mapping for @/ imports
   - Test file pattern: src/**/__tests__/**/*.test.{ts,tsx}
   - Coverage reporting configured

2. **jest.setup.ts** - Jest setup file
   - Imports @testing-library/jest-dom for DOM matchers
   - Mocks next/navigation (useRouter, useSearchParams, usePathname, etc.)
   - Mocks next/link component
   - Mocks next/image component

## Dependencies Installed

- **jest** (^29.7.0) - Testing framework
- **@testing-library/react** (^14.1.2) - React component testing utilities
- **@testing-library/jest-dom** (^6.1.5) - Jest DOM matchers
- **@testing-library/user-event** (^14.5.1) - User interaction simulation
- **@types/jest** (^29.5.11) - TypeScript types for Jest
- **ts-jest** (^29.1.1) - TypeScript support for Jest
- **jest-environment-jsdom** (^29.7.0) - jsdom environment for Jest

## Available Commands

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests should be created in the following location:
```
src/**/__tests__/**/*.test.ts
src/**/__tests__/**/*.test.tsx
```

## Example Test File

To start testing, create a test file like:
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('should render', () => {
    render(<button>Click me</button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Module Aliases

The jest configuration supports TypeScript path aliases:
- `@/*` maps to `src/*`

## Coverage

Coverage reports are generated in the `./coverage` directory and include:
- Statements, Branches, Functions, and Lines coverage
- Excludes type definitions (.d.ts) and index files

## Setup Complete

The testing infrastructure is ready to use. You can now:
1. Create test files in the src/**/__tests__/** directory
2. Run tests with npm test
3. Monitor test coverage with npm run test:coverage

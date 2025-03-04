# Contributing to DocWallet

This guide outlines the development standards for DocWallet, a secure, local-first document management app built with
React Native and TypeScript.

## Coding Standards

- **Clarity**: Use descriptive names and keep functions focused (e.g., `encryptDocument` not `processFile`).
- **Type Safety**: Leverage TypeScript types/interfaces for all components and data structures.
- **Formatting**: Rely on Prettier (via Git hooks) and ESLint for consistency—don’t override defaults unless critical.
- **Comments**: Add them only for complex logic, like encryption or biometric auth flows.

## Naming Conventions

- **Files**:
    - React components: PascalCase (e.g., `DocumentCard.tsx`)
    - Hooks/Utilities: camelCase (e.g., `useProfileAuth.ts`)
    - Tests: Match the file (e.g., `DocumentCard.test.tsx`)
- **Code**:
    - Types/Interfaces: Prefix with `I` (e.g., `IDocument`)
    - Props: Suffix with `Props` (e.g., `IDocumentCardProps`)
    - Functions: Use verb prefixes (e.g., `handleProfileSwitch`)
    - Booleans: Ask questions (e.g., `isDocumentExpired`)

## File Organization

```

src/
├── assets/ # Static files (images, fonts)
├── components/ # UI components
│ ├── common/ # Shared (e.g., Button, Modal)
│ └── features/ # Feature-specific (e.g., DocumentList)
├── config/ # App settings (e.g., theme, env)
├── hooks/ # Custom hooks (e.g., useEncryption)
├── navigation/ # Nav setup and routes
├── screens/ # Full-screen components
├── services/ # Logic (e.g., storage, auth)
├── store/ # State management
├── types/ # TypeScript definitions
└── utils/ # Helpers (e.g., dateFormat)

```

- **Imports**: Order: External > Internal absolute (e.g., `services/auth`) > Relative (e.g., `./utils`) > Styles.

## Component Standards

- **Structure**:

```typescript
import React from 'react';
import type { FC } from 'react';

interface IDocumentCardProps {
    documentId: string;
}

export const DocumentCard: FC<IDocumentCardProps> = ({ documentId }) => {
    // Hooks first
    // Handlers next
    // Render
    return <View>{/* JSX */ } < /View>;
};
```

- **Rules**:
    - One component per file.
    - Keep under 200 lines—extract logic to hooks if larger.
    - Use consistent prop names (e.g., `onPress` for actions).
    - Add error boundaries for critical components (e.g., document viewers).

## Security Monitoring Guide

DocWallet includes comprehensive monitoring tools for logging, error tracking, crash reporting, and performance
analysis.

### Logging System

```typescript
// Basic usage
import { LoggingService } from "../services/monitoring/loggingService";

LoggingService.debug("Loading document", { docId: "123" });
LoggingService.info("User logged in");
LoggingService.warn("Document expiring soon", { daysLeft: 5 });
LoggingService.error("Failed to decrypt", error);

// Component-specific logger (preferred)
const logger = LoggingService.getLogger("AuthService");
logger.info("PIN verified");
```

### Error Tracking

```typescript
import { ErrorTrackingService } from "../services/monitoring/errorTrackingService";

try {
    // Risky operation
} catch (error) {
    ErrorTrackingService.handleError(error, false); // Non-fatal error
}
```

### Performance Monitoring

```typescript
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService";

// Basic pattern
PerformanceMonitoringService.startMeasure("operation_name");
// ... perform operation
PerformanceMonitoringService.endMeasure("operation_name");

// For operations with return values
async function loadDocument(id) {
    PerformanceMonitoringService.startMeasure(`load_document_${id}`);
    try {
        return await actualLoadDocument(id);
    } finally {
        PerformanceMonitoringService.endMeasure(`load_document_${id}`);
    }
}
```

### Best Practices

1. **Be Descriptive**: Include contextual data with logs
2. **Use Appropriate Levels**: ERROR for actual errors, DEBUG for details
3. **Measure Critical Operations**: Focus on potentially slow operations
4. **Use Consistent Tags**: For easier log filtering
5. **Protect Sensitive Data**: Never log passwords, tokens, or PII

## Pull Requests

### Template

```
## What Changed
[Short description]

## Why
[Purpose or issue fixed]

## How
- [Key changes]
- [Testing done]

## Checklist
- [ ] Passes ESLint/Prettier
- [ ] Types updated
- [ ] Tested locally

## Related Issues
[Closes #n]
```

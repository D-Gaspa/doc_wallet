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

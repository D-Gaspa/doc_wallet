# State Management in Doc Wallet

This project uses [Zustand](https://github.com/pmndrs/zustand) for state management. Zustand is a small, fast, and
scalable state management solution that integrates seamlessly with React hooks.

## Why Zustand?

Zustand was chosen over alternatives like Redux or MobX for the following reasons:

- **Simplicity**: Minimal API, easy to learn and use.
- **Performance**: Lightweight with a small bundle size.
- **Flexibility**: Supports both global and local state management.
- **TypeScript Support**: Excellent built-in TypeScript compatibility.
- **Middleware**: Extensible with middleware for persistence, logging, etc.

## Store Structure

State management is split into distinct stores based on functionality:

- **`useAuthStore`**: Manages authentication-related state (e.g., user info, login status).
- **`useDocStore`**: Handles document-related state (e.g., document list, selected document).

Each store is defined in its own file within `src/store` and exported from `src/store/index.ts` for convenient imports.

## How to Use Stores

Stores are accessed in React components via hooks. Here’s how:

```typescript
import { useAuthStore } from './store';

function MyComponent() {
    const { user, isAuthenticated } = useAuthStore();
    return <div>{ isAuthenticated ? `Hello, ${user.name}` : 'Please log in' } < /div>;
}
```

Actions are called directly from the store:

```typescript
const { login, logout } = useAuthStore();
await login({ username: 'user', password: 'pass' });
```

## Middleware

The stores use the following middleware:

- **Logger**: Logs state changes for debugging (applied to all stores).
- **Persist**: Saves state to AsyncStorage (used in `useDocStore` for document persistence).

Middleware is defined in `src/store/middleware` and configured when creating the stores.

## Usage Examples

### Adding a Document

```typescript
import { useDocStore } from './store';

const { addDocument } = useDocStore();
await addDocument({ title: 'New Doc', content: 'Some content' });
```

### Checking Authentication

```typescript
import { useAuthStore } from './store';

const { isAuthenticated, checkAuthStatus } = useAuthStore();
await checkAuthStatus();
if (isAuthenticated) {
    console.log('User is logged in');
}
```

## State Persistence

The `useDocStore` uses the `persist` middleware with AsyncStorage to save documents across app sessions. The persisted
state is stored under the key `'doc-wallet-documents'`. This ensures that document data remains available even after the
app is closed.

# React Stack Patterns

**Purpose:** Stack-specific patterns, testing tools, and conventions for React projects. Loaded by the dev-story workflow when stack is detected as React.

---

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI primitives (Button, Input, etc.)
│   └── {feature}/       # Feature-specific components
├── hooks/               # Custom hooks
├── pages/ or app/       # Route-level components (Next.js: app/, Vite: pages/)
├── services/            # API calls, external service integrations
├── stores/ or context/  # State management (Zustand stores or React Context)
├── types/               # TypeScript type definitions
├── utils/               # Pure utility functions
├── lib/                 # Third-party library configurations
└── __tests__/           # Test files (alternative: co-located .test.tsx)
```

---

## Testing Tools & Patterns

### Primary Tools

| Tool | Purpose |
|------|---------|
| **Vitest** or **Jest** | Test runner and assertions |
| **React Testing Library** | Component rendering and interaction |
| **MSW (Mock Service Worker)** | API mocking |
| **user-event** | Simulating user interactions |

### TDD Cycle for React

#### RED: Write failing test first

```tsx
// src/components/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should call onSubmit with email and password', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'secret',
    });
  });
});
```

#### GREEN: Minimal implementation

```tsx
// src/components/LoginForm.tsx
export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ email, password }); }}>
      <label htmlFor="email">Email</label>
      <input id="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

#### REFACTOR: Improve while green

- Extract form state to custom hook if complex
- Add proper TypeScript types
- Apply project's component patterns

### Test Patterns

| Pattern | When to use |
|---------|-------------|
| `render()` + `screen.getByRole()` | Testing component output and accessibility |
| `userEvent.click/type` | Testing user interactions |
| `waitFor()` | Testing async operations |
| `MSW handlers` | Testing API-dependent components |
| `renderHook()` | Testing custom hooks in isolation |

### What to Test

- **Components:** Renders correct output, handles interactions, displays states (loading, error, success)
- **Hooks:** Returns correct values, handles state transitions, side effects
- **Services:** API calls with correct params, error handling
- **Utils:** Pure function input/output

### What NOT to Test

- Implementation details (state variable names, internal methods)
- Third-party library internals
- CSS/styling (unless behavior depends on it)

---

## Coding Standards

### Components

- Functional components only (no class components)
- Props interface defined with TypeScript
- Destructure props in function signature
- Export named components (not default exports, unless page-level)

### Hooks

- Prefix with `use` (e.g., `useAuth`, `usePagination`)
- One hook per file
- Return typed values

### State Management

- Local state: `useState` / `useReducer`
- Server state: TanStack Query (React Query)
- Global client state: Zustand (preferred) or Context
- Avoid prop drilling beyond 2 levels

### TypeScript

- Strict mode enabled
- No `any` types — use `unknown` if needed
- Interface for component props, type for unions/utilities
- Zod for runtime validation of external data

---

## Common Patterns

### Data Fetching (TanStack Query)

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => userService.getById(userId),
});
```

### Form Handling (React Hook Form + Zod)

```tsx
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });
```

### Error Boundaries

- Wrap route-level components with error boundaries
- Use `react-error-boundary` package

---

## Run Commands

```bash
# Tests
npm run test           # or: npx vitest
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# Linting
npm run lint           # ESLint
npm run lint:fix       # Auto-fix

# Type checking
npm run typecheck      # or: npx tsc --noEmit
```

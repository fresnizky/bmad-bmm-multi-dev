# React Native Stack Patterns

**Purpose:** Stack-specific patterns, testing tools, and conventions for React Native projects. Loaded by the dev-story workflow when stack is detected as React Native.

---

## Project Structure

### Expo

```
src/ or app/
├── app/                  # Expo Router file-based routing
│   ├── (tabs)/          # Tab navigation group
│   ├── (auth)/          # Auth flow group
│   └── _layout.tsx      # Root layout
├── components/          # Reusable components
│   ├── ui/             # Base UI primitives
│   └── {feature}/      # Feature-specific components
├── hooks/              # Custom hooks
├── services/           # API calls, external integrations
├── stores/             # State management (Zustand)
├── types/              # TypeScript types
├── utils/              # Pure utilities
├── constants/          # Theme, colors, dimensions
└── assets/             # Images, fonts
```

### Bare Workflow

```
src/
├── navigation/          # React Navigation setup
│   ├── RootNavigator.tsx
│   └── types.ts
├── screens/            # Screen-level components
├── components/         # Reusable components
├── hooks/              # Custom hooks
├── services/           # API layer
├── stores/             # State management
├── types/              # TypeScript types
├── utils/              # Utilities
└── native/             # Native module bridges (if any)
```

---

## Testing Tools & Patterns

### Primary Tools

| Tool | Purpose |
|------|---------|
| **Jest** | Test runner and assertions |
| **React Native Testing Library (RNTL)** | Component rendering and interaction |
| **MSW** | API mocking |
| **Detox** | End-to-end testing (optional, for critical flows) |

### TDD Cycle for React Native

#### RED: Write failing test first

```tsx
// src/screens/LoginScreen.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () => {
  it('should show error when submitting empty form', () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText('Sign In'));

    expect(screen.getByText(/email is required/i)).toBeTruthy();
  });

  it('should call login service with credentials', async () => {
    const mockLogin = jest.fn();
    render(<LoginScreen onLogin={mockLogin} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'secret');
    fireEvent.press(screen.getByText('Sign In'));

    expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'secret');
  });
});
```

#### GREEN: Minimal implementation

#### REFACTOR: Platform-specific improvements, animation optimization

### Test Patterns

| Pattern | When to use |
|---------|-------------|
| `render()` + `screen.getByText()` | Testing component output |
| `fireEvent.press/changeText` | Testing user interactions |
| `waitFor()` | Testing async operations |
| `renderHook()` | Testing custom hooks |
| **Detox** | Critical user flows (login, checkout, onboarding) |

### What to Test

- **Screens:** Renders correctly, navigation triggers, form submissions
- **Components:** Visual output, interaction handlers, platform-specific rendering
- **Hooks:** State transitions, side effects, API calls
- **Navigation:** Correct screen transitions, deep linking
- **Services:** API calls, error handling, data transformation

### Platform-Specific Testing

```tsx
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',  // or 'android'
  select: jest.fn(),
}));
```

---

## Coding Standards

### Components

- Functional components with TypeScript
- `StyleSheet.create()` for styles (not inline objects)
- Platform-specific code via `Platform.select()` or `.ios.tsx` / `.android.tsx` files
- Memoize expensive components with `React.memo`

### Navigation

- **Expo:** Expo Router (file-based)
- **Bare:** React Navigation with typed routes
- Define navigation types centrally
- Deep linking configuration from the start

### Performance

- Use `FlatList` / `FlashList` for lists (never `ScrollView` with `.map()`)
- Avoid anonymous functions in render (stable references)
- Use `useCallback` / `useMemo` for expensive computations
- Reanimated for animations (not Animated API for complex cases)
- Avoid large images without caching (`expo-image` or `FastImage`)

### State Management

- Local state: `useState` / `useReducer`
- Server state: TanStack Query
- Global client state: Zustand
- Persistent state: MMKV (preferred) or AsyncStorage

### TypeScript

- Strict mode enabled
- Navigation params typed
- No `any` — use `unknown` for external data

---

## Common Patterns

### Safe Area Handling

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
// Always wrap screens in SafeAreaView
```

### Platform-Specific Code

```tsx
// Option 1: Platform.select
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 4 },
  }),
});

// Option 2: Separate files
// Component.ios.tsx / Component.android.tsx
```

### Responsive Design

```tsx
import { useWindowDimensions } from 'react-native';
const { width, height } = useWindowDimensions();
```

---

## Run Commands

```bash
# Tests
npm run test                # Jest
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage

# E2E (Detox)
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug

# Linting
npm run lint
npm run lint:fix

# Type checking
npx tsc --noEmit

# Platform-specific
npx expo start              # Expo
npx react-native run-ios    # Bare
npx react-native run-android
```

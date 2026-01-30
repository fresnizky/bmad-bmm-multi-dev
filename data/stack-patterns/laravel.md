# Laravel Stack Patterns

**Purpose:** Stack-specific patterns, testing tools, and conventions for Laravel projects. Loaded by the dev-story workflow when stack is detected as Laravel.

---

## Project Structure

```
app/
├── Http/
│   ├── Controllers/       # Thin controllers — delegate to services
│   ├── Requests/          # Form Requests (validation)
│   ├── Resources/         # API Resources (response transformation)
│   └── Middleware/
├── Models/                # Eloquent models with relationships, scopes, accessors
├── Services/              # Business logic (injected into controllers)
├── Policies/              # Authorization logic
├── Events/                # Domain events
├── Listeners/             # Event handlers
├── Jobs/                  # Queued jobs
├── Mail/                  # Mailable classes
├── Notifications/
├── Enums/                 # PHP enums for status/type fields
└── Exceptions/

database/
├── migrations/            # Immutable once deployed
├── factories/             # Model factories for testing
└── seeders/

routes/
├── api.php               # API routes
├── web.php               # Web routes
└── console.php           # Artisan commands

tests/
├── Feature/              # HTTP-level tests (routes, controllers, middleware)
├── Unit/                 # Isolated logic tests (services, models, utils)
└── TestCase.php
```

---

## Testing Tools & Patterns

### Primary Tools

| Tool | Purpose |
|------|---------|
| **Pest** (preferred) or **PHPUnit** | Test runner and assertions |
| **Laravel's built-in testing** | HTTP tests, database assertions, mocking |
| **Factories** | Test data generation |
| **Faker** | Realistic fake data |

### TDD Cycle for Laravel

#### RED: Write failing test first

```php
// tests/Feature/Auth/LoginTest.php
use App\Models\User;

it('authenticates a user with valid credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt('secret'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'secret',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'user']);
});

it('rejects invalid credentials', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'wrong',
    ]);

    $response->assertUnauthorized();
});
```

#### GREEN: Minimal implementation

```php
// app/Http/Controllers/AuthController.php
class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->validated())) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['token' => $token, 'user' => new UserResource($user)]);
    }
}
```

#### REFACTOR: Extract to service, add API Resource, improve error handling

### Test Patterns

| Pattern | When to use |
|---------|-------------|
| **Feature tests** | HTTP endpoints, full request/response cycle |
| **Unit tests** | Business logic in services, model methods, scopes |
| `$this->postJson()` / `getJson()` | Testing API endpoints |
| `assertDatabaseHas()` | Verifying data was persisted |
| `$this->actingAs($user)` | Testing authenticated routes |
| `Bus::fake()` / `Event::fake()` | Testing dispatched jobs/events |
| `Notification::fake()` | Testing notifications |
| `Queue::fake()` | Testing queued jobs |

### What to Test

- **Feature tests:**
  - Every API endpoint (success and error cases)
  - Authentication and authorization (policies)
  - Validation rules (Form Requests)
  - Response structure (API Resources)
  - Middleware behavior

- **Unit tests:**
  - Service methods with business logic
  - Model scopes and computed attributes
  - Utility functions
  - Enum behaviors

### Database Testing

```php
// Always use RefreshDatabase or DatabaseTransactions
uses(RefreshDatabase::class);

// Use factories, never manual inserts
$user = User::factory()
    ->has(Post::factory()->count(3))
    ->create();
```

---

## Coding Standards

### Controllers

- **Thin controllers** — delegate to services for business logic
- Use Form Requests for validation (never validate in controller)
- Use API Resources for response transformation
- Use Policies for authorization
- Single responsibility: one resource per controller, or invokable controllers

### Models

- Define `$fillable` or `$guarded`
- Relationships as methods with return types
- Scopes for reusable query logic
- Accessors/Mutators using `Attribute` casts (Laravel 9+)
- Enums for status fields

```php
class User extends Authenticatable
{
    protected $fillable = ['name', 'email', 'password'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'status' => UserStatus::class,
        ];
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', UserStatus::Active);
    }
}
```

### Services

- Injectable via constructor (use Laravel's service container)
- One service per domain concern
- Return typed values, throw domain exceptions

```php
class AuthService
{
    public function login(string $email, string $password): AuthResult
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password])) {
            throw new InvalidCredentialsException();
        }

        $user = Auth::user();
        $token = $user->createToken('auth')->plainTextToken;

        return new AuthResult(user: $user, token: $token);
    }
}
```

### Form Requests

```php
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}
```

### Migrations

- Immutable once deployed — create new migration for changes
- Use descriptive names: `create_users_table`, `add_role_to_users_table`
- Always define `down()` method
- Use foreign key constraints

---

## Common Patterns

### API Resources

```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'posts_count' => $this->whenCounted('posts'),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
```

### Policy Authorization

```php
// Controller
$this->authorize('update', $post);

// Policy
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}
```

### Queued Jobs

```php
// Dispatch
ProcessReport::dispatch($report)->onQueue('reports');

// Test
Bus::fake();
// ... trigger action ...
Bus::assertDispatched(ProcessReport::class);
```

---

## Run Commands

```bash
# Tests
php artisan test                     # Pest/PHPUnit
php artisan test --filter=LoginTest  # Specific test
php artisan test --coverage          # With coverage

# Linting
./vendor/bin/pint                    # Laravel Pint (code style)
./vendor/bin/phpstan analyse         # Static analysis (if configured)

# Database
php artisan migrate                  # Run migrations
php artisan migrate:fresh --seed     # Fresh DB with seeders
php artisan db:seed                  # Run seeders

# Development
php artisan serve                    # Dev server
php artisan route:list               # List routes
php artisan make:model User -mfsc    # Model + migration + factory + seeder + controller
```

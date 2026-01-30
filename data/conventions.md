# Development Conventions

**Purpose:** Defines branch naming, commit messages, and PR conventions for consistent multi-session development.

---

## Branch Naming

### Format

```
{type}/{story-key}
```

### Branch Types

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | New feature stories | `feat/1-2-user-auth` |
| `fix` | Bug fix stories | `fix/2-3-login-error` |
| `refactor` | Refactoring stories | `refactor/1-5-api-cleanup` |
| `chore` | Maintenance/infra stories | `chore/1-1-project-setup` |

### Rules

- Always branch from `main` (or the configured base branch)
- Story key comes directly from the story file name (without `.md`)
- All lowercase, hyphens only (no underscores, no spaces)
- One branch per story, one story per branch

### Examples

```
feat/1-2-user-authentication
fix/2-3-password-reset-error
refactor/1-5-api-response-format
chore/1-1-initial-project-setup
```

---

## Commit Messages

### Format: Conventional Commits

```
{type}({scope}): {description}

[optional body]
```

### Types

| Type | Purpose |
|------|---------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `test` | Adding or updating tests |
| `refactor` | Code restructuring without behavior change |
| `chore` | Build, tooling, dependencies |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |

### Scope

The scope is the story key or the primary module/component affected:

```
feat(1-2-user-auth): add login endpoint
test(1-2-user-auth): add unit tests for auth middleware
fix(1-2-user-auth): handle expired token edge case
```

### Rules

- Subject line: max 72 characters
- Imperative mood: "add" not "added" or "adds"
- No period at the end of the subject line
- Body (optional): explain WHY, not WHAT (the diff shows what)
- One commit per completed task (after checkpoint approval)

### Per-Task Commit Template

When a task is approved at checkpoint, the commit message follows:

```
{type}({story-key}): {task-description}

Task: {task-number} - {task-title}
Story: {story-key}
```

**Example:**

```
feat(1-2-user-auth): add JWT token generation

Task: 3 - Implement token management
Story: 1-2-user-auth
```

---

## Pull Request Convention

### PR Title

```
{type}({story-key}): {story-title}
```

**Example:**
```
feat(1-2-user-auth): User authentication
```

### PR Body Template

```markdown
## Story

**Key:** {story-key}
**Title:** {story-title}
**Epic:** {epic-name}

## Summary

{brief-description-of-what-was-implemented}

## Changes

{bulleted-list-of-key-changes}

## Acceptance Criteria

{checklist-of-ACs-from-story}

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual verification completed
- [ ] No regressions introduced

## Manual Verification Steps

{steps-generated-in-workflow-step-7}
```

### PR Labels (optional)

| Label | When |
|-------|------|
| `feature` | New functionality |
| `bugfix` | Bug fix |
| `refactor` | Code restructuring |
| `ready-for-review` | PR is ready |
| `changes-requested` | Review feedback pending |

---

## Merge Strategy

### Squash Merge (Default)

All task commits in the feature branch are squashed into a single commit on `main`.

**Squash commit message:**
```
{type}({story-key}): {story-title} (#{pr-number})
```

This means:
- Task-level commits are for **local tracking only**
- The final commit on `main` is clean and atomic per story
- Git history on `main` reads as one commit per story

### Post-Merge

After PR is merged:
1. Delete remote branch
2. Delete local branch
3. Remove worktree
4. Update sprint board to `done`

# Sprint Board Schema

**Purpose:** Defines the structure and operating protocol for the shared sprint board used in multi-session development.

---

## Location

```
{project-root}/{board_dir}/
├── sprint-board.yaml          # Shared state file
└── sprint-board.lock/         # Directory-based lock (exists = locked)
```

The `{board_dir}` directory MUST be added to `.gitignore` — it is local-only state, not version-controlled.

---

## Concurrency Protocol

Multiple sessions may attempt to read/write the board simultaneously. All writes MUST follow this protocol:

### Acquire Lock

```bash
BOARD_DIR="$(git rev-parse --show-toplevel)/{board_dir}"
LOCK="$BOARD_DIR/sprint-board.lock"

# Attempt lock (mkdir is atomic on POSIX filesystems)
MAX_RETRIES=10
RETRY=0
while ! mkdir "$LOCK" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Could not acquire sprint board lock after $MAX_RETRIES attempts"
    exit 1
  fi
  sleep 0.5
done
```

### Release Lock

```bash
rmdir "$LOCK"
```

### Stale Lock Detection

If a lock exists for more than 30 seconds, it is considered stale and can be forcefully removed:

```bash
if [ -d "$LOCK" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -f %m "$LOCK" 2>/dev/null || stat -c %Y "$LOCK") ))
  if [ "$LOCK_AGE" -gt 30 ]; then
    rmdir "$LOCK"  # Force remove stale lock
  fi
fi
```

---

## Session Registry

Each active development session registers itself when claiming a story.

### Session Fields

| Field | Type | Description |
|-------|------|-------------|
| `story` | string | Story key (e.g., "1-2-user-auth") |
| `branch` | string | Git branch name (e.g., "feat/1-2-user-auth") |
| `worktree` | string | Worktree path relative to project root |
| `stack` | string | Detected or configured tech stack |
| `status` | enum | `in-progress`, `checkpoint`, `blocked`, `review`, `done` |
| `started_at` | ISO 8601 | When the session started |
| `last_checkpoint` | ISO 8601 | Last checkpoint timestamp |
| `current_task` | string | Current task description |

### Session ID Generation

Session IDs are generated as: `sess-` + first 6 chars of a random hash.

```bash
SESSION_ID="sess-$(openssl rand -hex 3)"
```

---

## Story Status

### Status Flow

```
ready-for-dev → claimed → in-progress → review → done
```

| Status | Meaning |
|--------|---------|
| `ready-for-dev` | Available for any session to claim |
| `claimed` | Reserved by a session, worktree being set up |
| `in-progress` | Active development in progress |
| `review` | All tasks complete, PR created, awaiting review |
| `done` | PR merged, worktree cleaned up |

### Story Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | Current story status |
| `claimed_by` | string | Session ID that claimed this story (empty if available) |
| `branch` | string | Git branch name |
| `pr_url` | string | Pull request URL (populated in step 9) |
| `completed_at` | ISO 8601 | When the story was marked done |

---

## Board Initialization

When the workflow starts and no board exists, it should:

1. Create the `{board_dir}/` directory
2. Add `{board_dir}/` to `.gitignore` if not already present
3. Populate `sprint-board.yaml` from the existing `sprint-status.yaml` (if it exists) or from story files directly
4. Set all discovered stories with appropriate statuses

---

## Reading the Board from a Worktree

Since worktrees have a different working directory, the board must be accessed via the project root:

```bash
# From any worktree, get the project root:
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# But worktrees report their own root, so use git-common-dir:
GIT_COMMON="$(git rev-parse --git-common-dir)"
PROJECT_ROOT="$(dirname "$GIT_COMMON")"

# Board is at:
BOARD="$PROJECT_ROOT/{board_dir}/sprint-board.yaml"
```

**Critical:** Always use `git rev-parse --git-common-dir` (not `--show-toplevel`) to find the true project root from a worktree.

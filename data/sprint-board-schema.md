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
| `port_slot` | integer | Docker port slot (1-N, only when docker_isolation is enabled) |
| `compose_project` | string | Docker Compose project name (e.g., "alquileres-wt-1-2-story") |
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

---

## Stale Session Detection

Sessions are considered **stale** when `last_checkpoint` (or `started_at` if no checkpoint) exceeds `{docker_stale_hours}` hours ago AND the session status is not `done` or `review`.

### Automatic Detection (Step 1)

On every workflow run, after loading the board, the workflow scans for stale sessions and prompts the user to clean them up before proceeding.

### Cleanup Sequence (per session)

When a stale or orphaned session is cleaned up, the following resources are released in order:

1. **Docker containers** (if `docker_isolation` enabled): `docker compose -p {compose_project} down -v`
2. **Generated env file**: `rm -f {worktree_path}/{docker_env_file}`
3. **Git worktree**: `git worktree remove {worktree_path} --force`
4. **Git branch**: `git branch -D {branch_name}`
5. **Board session**: Remove session entry, reset story to `ready-for-dev`, clear `claimed_by`

### Manual Garbage Collection (GC Mode)

The workflow supports a dedicated maintenance mode (invoked with `cleanup`/`gc`/`maintenance` argument, or option 4 in the "no stories" menu) that performs a full cross-reference audit:

| Resource | Checked against | Orphan condition |
|----------|----------------|------------------|
| Worktree directories | Board sessions | Directory exists but no matching session |
| Board sessions | Worktree directories | Session exists but directory missing |
| Docker projects | Board sessions | Running project with no matching session |
| Git branches | Board sessions | Branch matches pattern but no session |

GC mode offers three cleanup levels:
- **All orphans** — Clean only resources with no matching active session
- **Selective** — User picks specific resources from a numbered list
- **Force all** — Nuclear option: stop everything, reset board (requires "CONFIRM")

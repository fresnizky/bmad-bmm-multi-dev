# BMM Multi-Dev: Multi-Session Implementation

**Extension module for BMM Phase 4** — Enables parallel development sessions with git worktrees, a shared sprint board, manual checkpoints per task, and stack-specialized agents.

## Overview

This module replaces the standard `dev-story` workflow with a multi-session variant designed to simulate a collaborative development team. Multiple Claude Code sessions can work on different stories simultaneously, each in its own git worktree, coordinated through a shared sprint board.

## Key Features

- **Git Worktrees** — Each session gets its own isolated working directory
- **Sprint Board** — Shared state file with lock-based concurrency for parallel sessions
- **Manual Checkpoints** — Approve, fix, reject, or pause after each task implementation
- **Stack-Specialized Agents** — React, React Native, and Laravel agents with TDD patterns
- **PR Workflow** — Conventional commits, branch naming, and automated PR creation
- **Squash Merge** — Clean git history with one commit per story on main

## Installation

```bash
npx bmad-method@latest install
# Select BMM + bmm-multi-dev extension during installation
```

### Manual Installation

Copy the module contents to your BMAD project:

```bash
cp -r bmm-multi-dev/ <your-project>/_bmad/bmm-multi-dev/
```

## Components

### Agents

| Agent | Stack | File |
|-------|-------|------|
| React Dev ⚛️ | React / Next.js / Vite | `agents/react-dev.md` |
| RN Dev 📱 | React Native / Expo | `agents/rn-dev.md` |
| Laravel Dev 🔺 | Laravel / PHP | `agents/laravel-dev.md` |

### Workflows

| Workflow | Description | Path |
|----------|-------------|------|
| **dev-story** | Multi-session story execution (overrides BMM dev-story) | `workflows/4-implementation/dev-story/` |

### Data & Templates

| File | Purpose |
|------|---------|
| `data/conventions.md` | Branch naming, commit messages, PR conventions |
| `data/sprint-board-schema.md` | Sprint board structure and concurrency protocol |
| `data/stack-patterns/react.md` | React TDD patterns and coding standards |
| `data/stack-patterns/react-native.md` | React Native TDD patterns and coding standards |
| `data/stack-patterns/laravel.md` | Laravel TDD patterns and coding standards |
| `templates/sprint-board.yaml` | Initial sprint board template |
| `templates/pr-template.md` | Pull request body template |

## Quick Start

1. Install the module in your BMAD project
2. Start a Claude Code session
3. Run `/bmad-bmm-dev-story` — the workflow will:
   - Find an available story from the sprint board
   - Create a git worktree and branch
   - Detect your tech stack (or use configured default)
   - Implement task by task with TDD (Red-Green-Refactor)
   - Present each task for your approval at checkpoint
   - On story completion, create a PR

### Running Multiple Sessions

Open multiple Claude Code terminals and run `/bmad-bmm-dev-story` in each. The sprint board coordinates which story each session works on.

## Workflow Steps

| Step | Name | Description |
|------|------|-------------|
| 1 | Claim Story | Find available story, register session on sprint board |
| 2 | Setup Worktree | Create branch + worktree, set working directory |
| 3 | Load Context | Load story, detect stack, load specialized agent patterns |
| 4 | Implement Task | TDD cycle (Red-Green-Refactor) with stack patterns |
| 5 | Checkpoint | Run tests, present diff and summary for review |
| 6 | User Approval | Approve → commit. Fix → rework. Reject → revert. Pause → stash |
| 7 | Story Complete | Generate manual verification checklist from ACs |
| 8 | Code Review | Facilitate code review (suggest different LLM) |
| 9 | Finalize PR | Push branch, create PR, update sprint board |
| 10 | Post-Merge Cleanup | Remove worktree, delete branch, mark story done |

## Configuration

Module variables (configured during installation):

| Variable | Description | Default |
|----------|-------------|---------|
| `worktree_dir` | Directory for git worktrees | `.worktrees` |
| `board_dir` | Directory for sprint board | `_bmad-board` |
| `default_stack` | Primary tech stack | `react` |
| `pr_merge_strategy` | PR merge strategy | `squash` |

## Module Structure

```
bmm-multi-dev/
├── module.yaml
├── README.md
├── TODO.md
├── agents/
│   ├── react-dev.md
│   ├── rn-dev.md
│   └── laravel-dev.md
├── workflows/
│   └── 4-implementation/
│       └── dev-story/
│           ├── workflow.yaml
│           ├── instructions.xml
│           └── checklist.md
├── data/
│   ├── conventions.md
│   ├── sprint-board-schema.md
│   └── stack-patterns/
│       ├── react.md
│       ├── react-native.md
│       └── laravel.md
├── templates/
│   ├── sprint-board.yaml
│   └── pr-template.md
└── _module-installer/
    ├── installer.js
    └── platform-specifics/
        └── claude-code.js
```

## Author

Fede — Custom BMAD extension for multi-session development workflows.

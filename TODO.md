# BMM Multi-Dev — TODO

## Agents

- [x] react-dev.md — React Developer Agent
- [x] rn-dev.md — React Native Developer Agent
- [x] laravel-dev.md — Laravel Developer Agent

## Workflows

- [x] dev-story — Multi-session story execution (workflow.yaml + instructions.xml + checklist.md)

## Data & Templates

- [x] conventions.md — Branch, commit, PR conventions
- [x] sprint-board-schema.md — Board structure and concurrency protocol
- [x] stack-patterns/react.md — React TDD patterns
- [x] stack-patterns/react-native.md — React Native TDD patterns
- [x] stack-patterns/laravel.md — Laravel TDD patterns
- [x] templates/sprint-board.yaml — Board template
- [x] templates/pr-template.md — PR body template

## Installation

- [x] _module-installer/installer.js — Main installer
- [x] _module-installer/platform-specifics/claude-code.js — Claude Code integration

## Documentation

- [x] README.md — Module overview and quick start
- [x] TODO.md — This file

## Testing

- [ ] Test installation in a fresh BMAD project
- [ ] Test multi-session workflow with two parallel Claude Code sessions
- [ ] Test sprint board locking under concurrent access
- [ ] Test worktree creation and cleanup
- [ ] Test stack detection for React, React Native, and Laravel projects
- [ ] Test checkpoint flow (approve, fix, reject, pause)
- [ ] Test PR creation with gh CLI

## Future Enhancements

- [ ] Add more stack patterns (Vue, Angular, Node/Express, Python/Django)
- [ ] Sprint board web dashboard (read-only view)
- [ ] Automatic conflict detection between parallel sessions
- [ ] Session timeout and stale session cleanup
- [ ] Support for monorepo projects with multiple stacks per story

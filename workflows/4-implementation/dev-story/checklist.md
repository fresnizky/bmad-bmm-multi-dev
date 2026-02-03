---
title: 'Multi-Dev Story Definition of Done Checklist'
validation-target: 'Story markdown ({{story_path}})'
validation-criticality: 'HIGHEST'
required-inputs:
  - 'Story markdown file with enhanced Dev Notes'
  - 'Completed Tasks/Subtasks section with all items marked [x]'
  - 'Updated File List section with all changed files'
  - 'Updated Dev Agent Record with implementation notes'
  - 'All checkpoint approvals received'
optional-inputs:
  - 'Test results output'
  - 'CI logs'
  - 'Linting reports'
  - 'Code review results'
validation-rules:
  - 'Only permitted story sections modified: Tasks/Subtasks checkboxes, Dev Agent Record, File List, Change Log, Status'
  - 'All implementation requirements from story Dev Notes must be satisfied'
  - 'Every task was individually approved at checkpoint before commit'
  - 'Git branch follows naming conventions'
  - 'All commits follow conventional commits format'
---

# Definition of Done Checklist — Multi-Dev

**Critical validation:** Story is truly ready for PR only when ALL items below are satisfied.

## Git & Workflow Compliance

- [ ] **Branch Convention:** Branch name follows `{type}/{story-key}` pattern from conventions
- [ ] **Commit Convention:** All commits follow conventional commits format
- [ ] **Worktree Isolation:** All development was done within the assigned worktree
- [ ] **Sprint Board Updated:** Board reflects current story and session state
- [ ] **Checkpoint Approvals:** Every task was approved by user at checkpoint before commit

## Implementation Completion

- [ ] **All Tasks Complete:** Every task and subtask marked complete with [x]
- [ ] **Acceptance Criteria Satisfaction:** Implementation satisfies EVERY Acceptance Criterion
- [ ] **No Ambiguous Implementation:** Clear implementation meeting story requirements
- [ ] **Edge Cases Handled:** Error conditions and edge cases appropriately addressed
- [ ] **Dependencies Within Scope:** Only uses dependencies specified in story or project-context.md
- [ ] **Stack Patterns Applied:** Implementation follows the detected stack patterns

## Testing & Quality (TDD — Red-Green-Refactor)

- [ ] **Unit Tests:** Unit tests added/updated for ALL core functionality
- [ ] **Integration Tests:** Added when story requirements demand them
- [ ] **End-to-End Tests:** Created for critical user flows when story specifies
- [ ] **Test Coverage:** Tests cover acceptance criteria and edge cases
- [ ] **Regression Prevention:** ALL existing tests pass
- [ ] **Code Quality:** Linting and static checks pass when configured
- [ ] **TDD Compliance:** Tests were written BEFORE implementation for each task

## Documentation & Tracking

- [ ] **File List Complete:** Includes EVERY new, modified, or deleted file
- [ ] **Dev Agent Record Updated:** Contains implementation notes
- [ ] **Change Log Updated:** Includes summary of each task's changes
- [ ] **Review Follow-ups:** All review follow-up tasks completed (if applicable)
- [ ] **Story Structure Compliance:** Only permitted sections modified

## Manual Verification

- [ ] **Verification Checklist Generated:** Step 7 produced actionable verification steps
- [ ] **User Verified:** User confirmed manual verification passed

## Docker Isolation (when enabled)

- [ ] **Port Slot Allocated:** Port slot was allocated and recorded in sprint board
- [ ] **Env File Generated:** {docker_env_file} was generated with correct port offsets
- [ ] **Containers Healthy:** Containers started and passed health checks
- [ ] **Containers Cleaned Up:** Containers were stopped/removed during cleanup
- [ ] **Port Slot Released:** Port slot was released on session end

## Resource Cleanup

- [ ] **Stale Detection Ran:** Stale sessions were checked at workflow start
- [ ] **No Orphaned Worktrees:** No worktree directories exist without matching board session
- [ ] **No Ghost Sessions:** No board sessions exist without worktree on disk
- [ ] **No Orphaned Containers:** No Docker projects running without matching session (when docker_isolation enabled)
- [ ] **Board Consistent:** All board session entries match actual resource state

## Final Status

- [ ] **Story Status:** Set to "review"
- [ ] **Sprint Board:** Updated to "review" with PR URL
- [ ] **Sprint Status File:** Updated to "review" (if exists)
- [ ] **PR Created:** Pull request created following PR template convention
- [ ] **Branch Pushed:** Branch pushed to remote with -u flag

## Final Validation Output

```
Definition of Done: {{PASS/FAIL}}

✅ Story: {{story_key}}
🌿 Branch: {{branch_name}}
🔗 PR: {{pr_url}}
📊 Completion: {{completed_items}}/{{total_items}} items passed
🧪 Tests: {{test_results_summary}}
📋 Checkpoints: {{checkpoint_count}} tasks approved
```

**If FAIL:** List specific failures and required actions.
**If PASS:** Story is ready for PR review and merge.

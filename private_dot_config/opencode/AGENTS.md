Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Priorities:** Optimise for reviewable changes, proportional validation, and completing agreed work. Match the process to the scope and risk of the task.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- Investigate discoverable facts in the code, documentation, and available tools before asking me.
- State assumptions that materially affect the approach.
- Ask when a decision materially affects scope, behaviour, architecture, or a stated preference. Explain the options with concrete examples and a recommendation.
- If a simpler approach exists, say so. Push back when warranted.
- During planning, resolve uncertainties that materially affect implementation. Name the blocker and ask before proceeding with dependent work; continue independent investigation where useful.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Before adding an implementation, look for existing project utilities and maintained library functionality.
- Reuse a shared implementation for equivalent local, CI, and user-facing workflows.
- Do not copy upstream implementations to work around dependency boundaries without agreement. Explain when an upstream change is the better solution.
- Remove duplication introduced by the change without expanding into unrelated refactoring.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't perform unrelated refactoring.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Complete agreed work and validate proportionally.**

Transform tasks into verifiable goals:

- "Add validation" → "Verify invalid inputs are rejected and valid inputs still work."
- "Fix the bug" → "Reproduce the failure and verify the corrected behavior."
- "Refactor X" → "Verify affected behavior is preserved using focused checks."

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
Once a plan is approved for execution, complete it without repeatedly asking permission to continue.
Stop at requested review checkpoints or genuine blockers. Continue independent work when one part is blocked.

## 5. Tooling

Use `jj` instead of `git` whenever in a Jujutsu repository.

## 6. Planning Phase

Plans consist of: short summary, agreed specification, actionable steps, and validation criteria.

Make requested review checkpoints and deferred checks explicit.
Work through agreed implementation units in order, validating at meaningful checkpoints according to section 7.

## 7. Proportional Validation

- Choose validation based on the behavior changed and its risk. Prefer focused tests and checks; batch expensive suites at meaningful checkpoints.
- For substantive bugs, normally add or extend a regression test and confirm it fails for the expected reason before fixing the bug.
- For new features, test observable behavior and important invariants.
- Do not add tests merely to verify documentation, formatting, linter configuration, implementation structure, or third-party tooling.
- Do not rerun checks after changes that cannot affect their results. Broaden validation when failures, risk, or unresolved concerns justify it.
- Respect explicitly requested implementation-first review and deferred validation.
- Report what was checked, the results, and what remains unverified.

## 8. Reviewable Commit History

- Optimize commits for human review. Each commit should represent one coherent change with a short explanation of what and why.
- Commit completed implementation units by default, unless I request an uncommitted review checkpoint. Include related tests and affected documentation in the same commit unless an agreed review workflow calls for separation.
- Absorb corrections and formatting fixes into the unpublished commit that introduced the change. Avoid accumulating fixup or revert/reapply commits.
- Preserve published history unless rewriting it is requested.
- For substantial restructuring, separate mechanical moves or extractions from renames and behavioral changes.
- Committing does not imply permission to push, publish, deploy, or update external trackers.

## 9. Documentation

- Update documentation affected by the change in the same implementation commit. Prefer docstrings and nearby library documentation.
- Describe current behavior and its rationale, rather than narrating the development process or obsolete approaches.
- Keep shared information in one authoritative place and link to it.
- AGENTS.md should contain instructions for agents, not duplicate general project documentation.

## 10. Explanation Style

- Start with the main point in plain language. Assume engineering experience, but not familiarity with this subsystem.
- Explain non-obvious changes through a small before/after example. Use diagrams or tables when they clarify relationships or state.
- Keep summaries and issue descriptions concise. Avoid jargon, repeated context, and procedural boilerplate.

---

**These guidelines are working if:** changes and commits are easy to review, validation targets meaningful risks, existing implementations are reused, and agreed work is completed with requested review checkpoints respected.

# Sentinel — Product Requirements Document

## Track

Track B: Developer Productivity Tools

## Problem

Agent-written code often ships with tests that exist but don't actually verify
behavior — a test suite can show 100% line coverage while catching zero real
bugs. This "fake coverage" is hard to spot by reading code or coverage reports
alone. Sentinel detects it using mutation testing: deliberately introducing small
bugs into code and checking whether the existing tests catch them. Tests that
miss the bug are toothless, regardless of what coverage tools report.

## Users

- **Primary**: a developer (or reviewer) who wants to know if a test suite for
  agent-generated code is trustworthy before merging or shipping it.
- **Secondary (for this hackathon)**: judges evaluating Sentinel's own repo
  against gate requirements — Sentinel demonstrates its own methodology by
  auditing itself.

## User stories & acceptance criteria

### US-1: View gate-readiness status
As a user, I want to see whether this project meets the hackathon's gate
requirements, so I can verify submission readiness at a glance.

- AC-1.1: Dashboard displays all 5 gate requirements by name.
- AC-1.2: Each requirement shows a pass/fail state based on a live check
  (file existence and/or CI status), not a hardcoded value.
- AC-1.3: If all 5 pass, dashboard displays an overall "all requirements
  satisfied" indicator.
- AC-1.4: If the live check itself fails (e.g. GitHub API unreachable), the
  dashboard shows an error state for that check rather than a false pass or
  a blank screen.

### US-2: Run a mutation-testing scan
As a user, I want to trigger a live scan of the demo repo, so I can see
Sentinel's core detection capability in action.

- AC-2.1: A "Run Scan" control is visible and enabled by default.
- AC-2.2: Clicking it shows a loading/in-progress state while the scan runs.
- AC-2.3: On success, the dashboard displays each survived mutant found —
  including its file, the original code, and the mutated code.
- AC-2.4: If the scan fails (Stryker error or Verifier/LLM error), the
  dashboard shows an explicit error state distinguishing which stage failed.

### US-3: Understand why a test suite missed a bug
As a user, I want a plain-language explanation for each survived mutant, so
I don't have to manually diff mutated code against my test suite to figure
out the gap myself.

- AC-3.1: Each survived mutant shown includes an explanation of why the test
  suite likely missed it.
- AC-3.2: Each survived mutant shown includes a concrete suggested fix
  (e.g. a specific assertion to add).
- AC-3.3: If the explanation/fix call fails for a specific mutant, that
  mutant still displays its raw data (location, original/mutated code)
  rather than being silently dropped from the list.

### US-4: See results even if the live scan can't run
As a user, I want to see the most recent successful scan even if a live
run fails (e.g. LLM API is rate-limited), so a transient failure doesn't
mean the dashboard is empty during a demo.

- AC-4.1: On first load (before any manual scan), the dashboard shows the
  last cached successful scan, if one exists, with a visible timestamp.
- AC-4.2: If a live "Run Scan" fails, the dashboard falls back to showing
  the cached result rather than an empty or broken state.
- AC-4.3: The UI clearly distinguishes a live result from a cached one.

### US-5: Verify dependencies are real
As a user, I want to know if a project's declared dependencies actually
exist on the npm registry, so I can catch AI-hallucinated package names
before they break a build.

- AC-5.1: Dependency check results show each checked package and whether it
  was found on the npm registry.
- AC-5.2: Any flagged (non-existent) package is visibly distinguished from
  passing ones.

## Out of scope (for this hackathon)

- Multi-repo support (currently targets `demo-repo/**/*.ts` only)
- User accounts / auth
- Support for languages other than TypeScript/JavaScript
- Deployed/hosted version (local execution only — see TASKS.md notes)

## Success metric for this submission

A judge can, within the live demo, see: gate compliance, one real survived
mutant with an accurate plain-language explanation, and one flagged fake
dependency — end to end, without reading source code.

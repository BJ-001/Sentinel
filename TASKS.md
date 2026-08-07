# Task Breakdown — Sentinel

This is the plan the team (and agents) worked through, in the order it was tackled.

## Completed
- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Stryker mutation-testing config, targeting `demo-repo/**/*.ts`
- [x] `demo-repo/isPositive.ts` + weak test — proof-of-concept demo scenario
- [x] Auditor agent — runs Stryker, parses mutation report, returns survived mutants
- [x] Verifier/Explainer agent — calls OpenRouter to explain gaps + suggest fixes
- [x] Fix-Suggestion skill — parses raw LLM output into structured explanation + fix
- [x] Dependency-hallucination checker — validates `package.json` deps against npm registry
- [x] `docs/architecture.md` — architecture documentation
- [x] `AGENTS.md` — project rules and stack decisions
- [x] `AGENTS_AND_SKILLS.md` — documents both agents and the skill
- [x] Gate-readiness dashboard — live self-check against the 5 hard gate requirements
- [x] Scan-results dashboard section — surfaces real Auditor/Verifier output (survived
      mutants, explanations, suggested fixes)
- [x] `prd.md` — PRD with user stories and acceptance criteria
- [x] Playwright end-to-end tests for the dashboard (13/13 passing)
- [x] Real CI/CD pipeline: install, lint, build, unit tests, Playwright run, artifact upload
- [x] Pre-commit hooks (Husky + lint-staged) enforcing ESLint on staged files
- [x] Jest unit test for AC-3.3 (verifier per-mutant failure isolation)
- [x] Tagged release `v0.1.0`
- [x] Tagged release `v0.2.0`
- [x] Tagged release `v0.2.1` — closes AC-3.3 test coverage gap, fixes a Stryker/Jest
      sandbox conflict that could break live scans in CI

## In progress
- none

## Remaining
- none — all PRD acceptance criteria are built and tested, except AC-1.4, which is a
  deliberate documented gap (see `prd.md` and `AGENTS.md` for reasoning: no real failure
  path exists in `/api/gate-status` to test)

## Notes
- Git workflow: branch per feature → build/test → commit → push → PR → confirm CI green
  → merge → sync `main` → new branch for next task
- Demo plan: run locally (`npm run dev`), not deployed to Vercel — mutation testing via
  `execSync` needs a persistent filesystem and isn't serverless-function-safe

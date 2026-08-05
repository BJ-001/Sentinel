# Task Breakdown — Sentinel

This is the plan the team (and agents) worked through, in the order it was tackled.

## Completed

- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Stryker mutation-testing config, targeting `demo-repo/**/*.ts`
- [x] `demo-repo/isPositive.ts` + weak test — proof-of-concept demo scenario
- [x] Auditor agent — runs Stryker, parses mutation report, returns survived mutants
- [x] Verifier/Explainer agent — calls Gemini to explain gaps + suggest fixes
- [x] Fix-Suggestion skill — parses raw LLM output into structured explanation + fix
- [x] Dependency-hallucination checker — validates `package.json` deps against npm registry
- [x] `docs/architecture.md` — architecture documentation
- [x] `AGENTS.md` — project rules and stack decisions
- [x] `AGENTS_AND_SKILLS.md` — documents both agents and the skill
- [x] Gate-readiness dashboard — live self-check against the 5 hard gate requirements
- [x] Tagged release `v0.1.0`

## In progress

- [ ] Scan-results dashboard section — surfaces real Auditor/Verifier output (survived
      mutants, explanations, suggested fixes) instead of just the gate checklist

## Remaining

- [ ] Spec / PRD with user stories and acceptance criteria
- [ ] Playwright end-to-end tests for the dashboard
- [ ] Wire real CI/CD steps (currently placeholder): install, lint, test, Playwright run,
      artifact upload
- [ ] Pre-commit hooks (Husky + lint-staged) enforcing ESLint/Prettier
- [ ] Final tagged release once the above is complete

## Notes

- Git workflow: branch per feature → build/test → commit → push → PR → confirm CI green
  → merge → sync `main` → new branch for next task
- Demo plan: run locally (`npm run dev`), not deployed to Vercel — mutation testing via
  `execSync` needs a persistent filesystem and isn't serverless-function-safe

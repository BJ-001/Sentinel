# AGENTS.md — Sentinel Project Rules

This file is the single source of truth for how any AI agent/tool (Cursor, Antigravity, Claude Code, Cline, Gemini, GitLab Duo CLI, etc.) should behave in this repo. Every tool should be pointed at this file. Keep it short — bloated rules files bury the important stuff.

## Project
Sentinel: a "fake coverage" detector for agent-written code. Runs mutation testing against a target repo (deliberately breaks logic in small, targeted ways) and checks whether the existing test suite actually catches each break. Surviving mutants (undetected breaks) are flagged as hollow/toothless tests, with a plain-language explanation and a suggested fix.

## Stack (do not deviate without updating this file)
- Target language for MVP: JavaScript/TypeScript (mutation testing via Stryker) —
  single-language scope for Day 1 to avoid multi-language complexity
- Frontend + Backend: **Next.js (App Router) + Tailwind** — single codebase, no separate backend service. API routes/Route Handlers serve as the backend. Chosen to keep the whole project in one language since Stryker is JS/TS-native — avoids a fragile cross-language bridge and reduces moving parts for a lean team in a one-week build.
- DB: Supabase (Postgres) — store scan results, flagged mutants, history
- Testing: Playwright (e2e for the dashboard itself) + Sentinel's own mutation-test output
  as its core testing/verification story
- CI: GitHub Actions (lint + test + build on every push)
- Deploy target: Vercel (pairs naturally with Next.js, free tier)

## Hard rules
- Human-in-the-loop: never auto-merge or auto-apply a suggested test fix without human review.
- Never claim a mutant is "caught" unless mutation-test output actually confirms it —
  no fabricated pass/fail results.
- Never commit secrets/API keys. All keys live in `.env`, which is gitignored.
  Use `.env.example` with placeholder values only.
- Commit continuously in small, logical units — no single giant end-of-day commit.
- Every PR must pass CI (lint, tests, build) before merge.

## Code conventions
- TypeScript strict mode on
- ESLint + Prettier, **enforced via pre-commit hook** (not just configured) — satisfies
  the hackathon's "linter, ideally with pre-commit hooks" scored item directly
- Conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`) — produces a clean,
  progressive commit history almost for free, itself a scored item
- No `any` types in TypeScript

## Folder structure
/app → Next.js pages + API routes (this is the "backend")
/api
/scan → triggers a mutation test run
/gate-status → gate-readiness check endpoint
/agents
/auditor → runs Stryker, collects surviving mutants
/verifier → explains gaps, suggests fixes
/lib → shared utilities (API clients for Gemini/NVIDIA/OpenRouter)
/tests
/e2e → Playwright tests
/demo-repo → curated repo with the planted fake-coverage example,
version-controlled so the live demo can't go stale or get lost
/docs
architecture.md
AGENTS_AND_SKILLS.md
.github/workflows/

## Known gotchas / do-not-touch
- Mutation testing can be slow on large repos — scope the demo repo deliberately small and curated, not a full real-world codebase, to keep the live demo fast and reliable.
- OpenRouter's free `:free` model IDs delist or change without notice. Don't hardcode a specific free model name anywhere critical. Verified working during setup:
  `openai/gpt-oss-20b:free`. Re-check openrouter.ai/models (free filter) before the hackathon and again on demo day, with a fallback model ID ready.
- Add gotchas here as they come up during the build.

## Agent-specific notes
- Mutator/Auditor agent: lives in `/agents/auditor`, runs mutation testing (Stryker) and collects surviving mutants (undetected breaks).
- Explainer/Verifier agent: lives in `/agents/verifier`, independently reviews each surviving mutant, explains in plain language why the test suite missed it, and proposes
  a fix. This is one of the two required "custom agent" gate items — document usage and
  design decisions in AGENTS_AND_SKILLS.md.
- Fix-suggestion skill: generates a ready-to-review patch/test snippet per flagged gap —
  [path once built]. This is the required "custom skill" gate item.
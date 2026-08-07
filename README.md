# Sentinel

Sentinel catches tests that exist but don't actually verify behavior. A
test suite can show 100% line coverage while catching zero real bugs —
"fake coverage" that's hard to spot by reading code or coverage reports
alone.

Sentinel uses mutation testing to detect this: it deliberately introduces
small bugs into code (via [Stryker](https://stryker-mutator.io/)) and
checks whether the existing tests catch them. Tests that miss the bug are
toothless, regardless of what coverage tools report. For each bug a test
suite misses, Sentinel generates a plain-language explanation of why the
test suite likely missed it, plus a concrete suggested fix.

## What's in this repo

- A gate-readiness dashboard showing whether this project meets its own
  submission requirements (docs present, custom agents/skills in place,
  CI/CD configured) — checked live, not hardcoded.
- A "Run Live Scan" flow: triggers a real mutation-testing run against
  `demo-repo/`, then generates an explanation + suggested fix for every
  survived mutant found.
- A dependency checker that verifies every package in `package.json`
  actually exists on the npm registry, to catch AI-hallucinated package
  names before they break a build.
- A full Playwright end-to-end test suite covering all of the above.

## Getting started

### Requirements

- Node.js 20+
- An [OpenRouter](https://openrouter.ai/) API key (used to generate
  plain-language explanations for survived mutants)

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

OPENROUTER_API_KEY=your-key-here


### Run the dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see the gate
readiness checklist, a "Run Live Scan" button, and a dependency check
section.

### Run the test suite

The Playwright suite exercises the full app end to end, including real
mutation-testing scans — expect it to take a few minutes.

```bash
npx playwright test
```

HTML report:

```bash
npx playwright show-report
```

### Lint / build

```bash
npm run lint
npm run build
```

## Project structure

- `agents/auditor/` — runs Stryker, collects survived mutants
- `agents/verifier/` — generates explanations + suggested fixes via
  OpenRouter for each survived mutant
- `app/` — Next.js dashboard (App Router), API routes, and UI components
- `lib/` — shared types and the dependency-hallucination checker
- `demo-repo/` — the small target codebase Sentinel scans for the demo
- `e2e/` — Playwright test suite
- `docs/architecture.md` — architecture overview

## Out of scope

This is a hackathon submission. It currently targets a single demo repo
(`demo-repo/**/*.ts`), TypeScript/JavaScript only, no auth, no hosted
deployment — see `docs/architecture.md` and `prd.md` for full details.

## Future Work

Sentinel currently demonstrates its detection capability against a bundled example codebase (`demo-repo/`) rather than accepting arbitrary user-submitted repositories. This was a deliberate scope decision: running mutation testing against untrusted, user-supplied code safely requires sandboxed execution (isolated dependency installation, resource/time limits, and protection against arbitrary code execution).

A natural next step would be to let users point Sentinel at their own repository (via upload or a Git URL) and have it run the same audit → verify → explain pipeline against their actual test suite. This would require:
- Sandboxed execution environment (e.g., ephemeral containers) for running untrusted `npm install` and test suites safely
- Dynamic Stryker configuration generation per scan, rather than a static `mutate` glob
- Handling for a much wider range of failure modes (missing dependencies, unsupported test runners, malformed repos, timeouts)

For now, the fixed demo repo lets Sentinel clearly demonstrate the core value proposition — catching tests that pass but don't actually verify behavior — in a controlled, reliable way.


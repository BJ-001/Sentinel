# AGENTS_AND_SKILLS.md — Sentinel

This document describes the custom agents and custom skill built as part of Sentinel.

---

## Custom Agents

### 1. Auditor Agent
**Location:** `agents/auditor/run.ts`

**Purpose:** Runs mutation testing against a target codebase and identifies which
mutants (deliberately introduced small bugs) survive — i.e., which bugs the existing
test suite fails to catch.

**How it works:**
1. Invokes Stryker (`npx stryker run`) programmatically against the configured target
   (`stryker.config.json`, currently scoped to `demo-repo/**/*.ts`)
2. Reads Stryker's JSON report output (`reports/mutation/mutation.json`)
3. Parses the report, extracting only the mutants with status `"Survived"`
4. For each survived mutant, extracts the original source line(s) and the mutated
   (buggy) replacement, using line-indexed slicing of the source file
5. Returns a clean, structured list (`SurvivedMutant[]`) — file name, mutator type,
   location, original code, mutated code

**Why this is a genuine agent, not just a script wrapper:** it autonomously runs an
external tool, interprets structured but complex output (Stryker's full report includes
killed, timed-out, and no-coverage mutants too — the Auditor selectively filters for the
signal that matters), and produces a clean contract that downstream components consume
without needing to understand Stryker's raw format.

**Input:** none required beyond the Stryker config already present in the repo
**Output:** `SurvivedMutant[]` — see `agents/auditor/run.ts` for the full type definition

---

### 2. Verifier / Explainer Agent
**Location:** `agents/verifier/run.ts`

**Purpose:** Takes the Auditor's list of survived mutants and, for each one, generates
a plain-language explanation of *why* the existing test suite failed to catch it, plus a
concrete suggested test assertion that would catch it.

**How it works:**
1. Receives `SurvivedMutant[]` from the Auditor
2. For each mutant, builds a targeted prompt containing the original code, the mutated
   (buggy) code, and instructions to explain the gap and suggest a fix
3. Calls the OpenRouter API (`openai/gpt-oss-20b:free` by default, configurable via
   `OPENROUTER_MODEL`) with this prompt
4. Passes the raw LLM response to the Fix-Suggestion Skill (see below) to extract a
   structured explanation + suggested fix
5. Runs all mutants concurrently (`Promise.all`), with each mutant's call isolated in
   its own try/catch — a failure on one mutant's call falls back to a graceful
   "explanation unavailable" result rather than dropping that mutant or failing the
   whole batch (verified by a dedicated Jest unit test in `agents/verifier/__tests__/run.test.ts`,
   since this failure path happens server-side and isn't reachable by Playwright)
6. Returns an enriched list (`VerifiedFinding[]`) — the original mutant data plus
   `explanation` and `suggestedFix` fields

**Why this is a genuine agent, not just an API call wrapper:** it performs a real
reasoning task (diagnosing *why* a test suite has a specific blind spot, not just
describing the code change), and its output is designed to be directly actionable by a
developer — this is the layer that turns "here's a list of bugs" into "here's why this
happened and how to fix it."

**Human-in-the-loop:** per `AGENTS.md`'s hard rules, this agent never applies its
suggested fixes automatically — output is always for human review.

**Input:** `SurvivedMutant[]` (from the Auditor)
**Output:** `VerifiedFinding[]` — see `agents/verifier/run.ts` for the full type definition

---

## Custom Skill

### Fix-Suggestion Skill
**Location:** `agents/verifier/fixSuggestionSkill.ts`

**Purpose:** A reusable, standalone capability that parses a raw LLM text response
(structured loosely with an "explanation" section and a "FIX:" marker) into a clean,
structured object with separate `explanation` and `suggestedFix` fields.

**Why this is a skill, not just a helper function tied to one agent:** it's intentionally
decoupled from the Verifier agent's specific prompt or use case — its only job is turning
free-text LLM output following a known convention into structured data. Any future agent
in this repo that needs the same "explanation + fix" pattern (for example, the
dependency-hallucination checker, if it adopts the same explanation format) can call this
skill directly rather than duplicating parsing logic.

**Input:** raw string (an LLM's text response)
**Output:** `{ explanation: string, suggestedFix: string }`

**Design note:** originally this parsing logic lived inline inside the Verifier agent.
It was extracted into its own module specifically to make the agent/skill separation
clear and unambiguous, both for this gate requirement and for genuine reusability as
Sentinel grows.

---

## How Agents and the Skill Work Together
Target Repo
↓
Auditor Agent (runs Stryker, filters for survived mutants)
↓ SurvivedMutant[]
Verifier Agent (calls OpenRouter per mutant, isolates per-mutant failures)
↓ raw LLM text
Fix-Suggestion Skill (parses raw text into structured data)
↓ { explanation, suggestedFix }
Verifier Agent (attaches structured data to each finding)
↓ VerifiedFinding[]
[Dashboard — displays results to the user]

This pipeline is intentionally modular: the Auditor doesn't know about LLMs, the
Verifier doesn't know about Stryker's report format, and the skill doesn't know about
mutation testing at all — each piece has one clear responsibility.

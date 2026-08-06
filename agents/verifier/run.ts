import 'dotenv/config';
import { extractFixSuggestion } from './fixSuggestionSkill';
import type { SurvivedMutant } from '../auditor/run';

export interface VerifiedFinding extends SurvivedMutant {
  explanation: string;
  suggestedFix: string;
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not found in .env');

  const model = process.env.OPENROUTER_MODEL ?? 'openai/gpt-oss-20b:free';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '(no response)';
}

function buildPrompt(mutant: SurvivedMutant): string {
  return `You are reviewing a mutation testing result. A test suite failed to catch a deliberately introduced bug.

Original code:
${mutant.originalCode}

Mutated (buggy) code that was NOT caught by any test:
${mutant.mutatedCode}

In 2-3 short sentences, explain in plain language why the existing test suite likely missed this bug. Then, on a new line starting with "FIX:", suggest a concrete one-line test assertion that would catch this specific mutation. Keep the whole response under 100 words.`;
}

export async function runVerifier(mutants: SurvivedMutant[]): Promise<VerifiedFinding[]> {
  const results = await Promise.all(
    mutants.map(async (mutant) => {
      try {
        const prompt = buildPrompt(mutant);
        const raw = await callOpenRouter(prompt);
        const { explanation, suggestedFix } = extractFixSuggestion(raw);
        return { ...mutant, explanation, suggestedFix };
      } catch (err) {
        console.error(`Verifier failed for mutant in ${mutant.fileName ?? "unknown file"}:`, err);
        return {
          ...mutant,
          explanation: "Explanation unavailable — the verifier call failed for this mutant.",
          suggestedFix: "N/A",
        };
      }
    })
  );

  return results;
}
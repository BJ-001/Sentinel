import 'dotenv/config';
import type { SurvivedMutant } from '../auditor/run';

export interface VerifiedFinding extends SurvivedMutant {
  explanation: string;
  suggestedFix: string;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not found in .env');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '(no response)';
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
  const results: VerifiedFinding[] = [];

  for (const mutant of mutants) {
    const prompt = buildPrompt(mutant);
    const raw = await callGemini(prompt);

    const [explanationPart, fixPart] = raw.split(/FIX:/i);

    results.push({
      ...mutant,
      explanation: explanationPart?.trim() ?? raw.trim(),
      suggestedFix: fixPart?.trim() ?? '(no fix suggested)',
    });
  }

  return results;
}
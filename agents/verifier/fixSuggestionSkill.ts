/**
 * Fix-Suggestion Skill
 *
 * A reusable capability (not tied to any one agent) that takes a raw LLM response
 * describing a code issue and extracts a structured explanation + concrete suggested
 * fix from it. Used by the Verifier agent, but designed to be callable by any future
 * agent that needs to turn free-text LLM output into a structured finding.
 */
export interface StructuredFinding {
  explanation: string;
  suggestedFix: string;
}

export function extractFixSuggestion(rawLLMResponse: string): StructuredFinding {
  const [explanationPart, fixPart] = rawLLMResponse.split(/FIX:/i);

  return {
    explanation: explanationPart?.trim() ?? rawLLMResponse.trim(),
    suggestedFix: fixPart?.trim() ?? '(no fix suggested)',
  };
}
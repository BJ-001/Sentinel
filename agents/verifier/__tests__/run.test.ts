import { runVerifier } from '../run';
import type { SurvivedMutant } from '../../auditor/run';

const baseMutant = (id: string): SurvivedMutant => ({
  id,
  mutatorName: 'EqualityOperator',
  fileName: 'demo-repo/isPositive.ts',
  location: { start: { line: 2, column: 1 }, end: { line: 2, column: 20 } },
  originalCode: 'return n > 0;',
  mutatedCode: 'return n >= 0;',
});

describe('runVerifier (AC-3.3: per-mutant failure isolation)', () => {
  const originalEnv = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns raw data with a fallback explanation for a mutant whose call fails, while other mutants still get real explanations', async () => {
    const mutants = [baseMutant('mutant-1'), baseMutant('mutant-2'), baseMutant('mutant-3')];

    let callCount = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Simulated OpenRouter failure'),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Real explanation.\nFIX: assertTrue(x);' } }],
          }),
      } as Response);
    });

    const results = await runVerifier(mutants);

    expect(results).toHaveLength(3);

    results.forEach((r, i) => {
      expect(r.id).toBe(mutants[i].id);
      expect(r.fileName).toBe(mutants[i].fileName);
      expect(r.originalCode).toBe(mutants[i].originalCode);
      expect(r.mutatedCode).toBe(mutants[i].mutatedCode);
    });

    expect(results[0].explanation).not.toMatch(/unavailable/i);
    expect(results[2].explanation).not.toMatch(/unavailable/i);

    expect(results[1].explanation).toMatch(/unavailable/i);
    expect(results[1].suggestedFix).toBe('N/A');
  });
});

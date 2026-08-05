'use client';

import { useEffect, useState } from 'react';

interface GateStatus {
  checks: Record<string, boolean>;
  allPassing: boolean;
}

const CHECK_LABELS: Record<string, string> = {
  architectureDoc: 'Architecture Document',
  agentsRulesFile: 'Agent Rules File (AGENTS.md)',
  agentsAndSkillsDoc: 'AGENTS_AND_SKILLS.md',
  auditorAgent: 'Custom Agent: Auditor',
  verifierAgent: 'Custom Agent: Verifier',
  fixSuggestionSkill: 'Custom Skill: Fix-Suggestion',
  ciWorkflow: 'CI/CD Workflow',
};

export default function Dashboard() {
  const [status, setStatus] = useState<GateStatus | null>(null);

  useEffect(() => {
    fetch('/api/gate-status')
      .then((res) => res.json())
      .then(setStatus)
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Sentinel</h1>
        <p className="text-gray-400 mb-8">Fake coverage detection & agent governance</p>

        <h2 className="text-xl font-semibold mb-4">Gate Readiness</h2>

        {!status && <p className="text-gray-500">Loading...</p>}

        {status && (
          <div className="space-y-2">
            {Object.entries(status.checks).map(([key, passing]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
              >
                <span>{CHECK_LABELS[key] ?? key}</span>
                <span className={passing ? 'text-green-400' : 'text-red-400'}>
                  {passing ? '✅ Pass' : '❌ Missing'}
                </span>
              </div>
            ))}

            <div
              className={`mt-6 rounded-lg px-4 py-3 font-semibold text-center ${
                status.allPassing
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              {status.allPassing
                ? 'All gate requirements satisfied ✅'
                : 'Some gate requirements missing ⚠️'}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
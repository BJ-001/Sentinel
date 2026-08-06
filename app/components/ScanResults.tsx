'use client';

import { useEffect, useState } from 'react';
import type { ScanResult } from '@/lib/types/scan';

type ViewState =
  | { kind: 'loading-cache' }
  | { kind: 'empty' }
  | { kind: 'cached'; result: ScanResult }
  | { kind: 'scanning'; previous: ScanResult | null }
  | { kind: 'success'; result: ScanResult }
  | { kind: 'error'; message: string; stage: 'auditor' | 'verifier' | 'unknown'; previous: ScanResult | null };

export default function ScanResults() {
  const [view, setView] = useState<ViewState>({ kind: 'loading-cache' });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (view.kind !== 'scanning') {
      setElapsedSeconds(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [view.kind]);

  useEffect(() => {
    fetch('/api/scan-results')
      .then((res) => {
        if (!res.ok) throw new Error('no cache');
        return res.json();
      })
      .then((result: ScanResult) => setView({ kind: 'cached', result }))
      .catch(() => setView({ kind: 'empty' }));
  }, []);

  async function runScan() {
    const previous =
      view.kind === 'cached' || view.kind === 'success'
        ? view.result
        : view.kind === 'error' || view.kind === 'scanning'
        ? view.previous
        : null;

    setView({ kind: 'scanning', previous });

    try {
      const res = await fetch('/api/scan-results', { method: 'POST' });
      const result: ScanResult = await res.json();

      if (!res.ok) {
        const stage = result.status === 'auditor_failed' ? 'auditor' : 'verifier';
        setView({ kind: 'error', message: result.error ?? 'Scan failed', stage, previous });
        return;
      }

      setView({ kind: 'success', result });
    } catch (err) {
      setView({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Network error',
        stage: 'unknown',
        previous,
      });
    }
  }

  const isScanning = view.kind === 'scanning';

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Mutation Scan Results</h2>
        <button
          onClick={runScan}
          disabled={isScanning}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed
                     text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {isScanning ? 'Scanning…' : 'Run Live Scan'}
        </button>
      </div>

      {view.kind === 'loading-cache' && <p className="text-gray-500">Checking for cached results...</p>}

      {view.kind === 'empty' && (
        <p className="text-gray-500">No scan has been run yet. Click &quot;Run Live Scan&quot; to start.</p>
      )}

      {view.kind === 'scanning' && (
        <div className="bg-gray-900 rounded-lg px-4 py-6 text-center text-gray-400">
          <div className="mb-2">
            {elapsedSeconds < 25
              ? 'Running Stryker mutation tests…'
              : 'Generating explanations…'}
          </div>
          <div className="text-xs text-gray-600 font-mono">{elapsedSeconds}s elapsed</div>
          <div className="mt-3 h-1 w-48 mx-auto bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(95, (elapsedSeconds / 75) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {view.kind === 'error' && (
        <div className="mb-4 bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
          <strong>Scan failed</strong> ({view.stage === 'auditor' ? 'Stryker run' : view.stage === 'verifier' ? 'Explanation generation' : 'unknown stage'}): {view.message}
          {view.previous && <span className="block mt-1 text-red-400">Showing last cached result below.</span>}
        </div>
      )}

      {(view.kind === 'cached' || view.kind === 'success' || (view.kind === 'error' && view.previous)) && (
        <ScanResultView
          result={view.kind === 'error' ? view.previous! : view.result}
          isLive={view.kind === 'success'}
        />
      )}
    </div>
  );
}

function ScanResultView({ result, isLive }: { result: ScanResult; isLive: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 text-sm">
        <span
          className={`px-2 py-1 rounded ${
            isLive ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'
          }`}
        >
          {isLive ? 'Live result' : 'Cached result'}
        </span>
        <span className="text-gray-500">{new Date(result.timestamp).toLocaleString()}</span>
        <span className="text-gray-500">
          Mutation score: {result.mutationScore}% ({result.survivedCount}/{result.totalMutants} survived)
        </span>
      </div>

      {result.findings.length === 0 && (
        <p className="text-gray-500">No survived mutants — test suite caught everything.</p>
      )}

      <div className="space-y-4">
        {result.findings.map((f) => (
          <div key={f.id} data-testid="finding-card" className="bg-gray-900 rounded-lg px-4 py-4">
            <div className="text-sm text-gray-400 mb-2">
              {f.fileName} · line {f.location.start.line} · {f.mutatorName}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm font-mono">
              <div className="bg-gray-950 rounded px-3 py-2">
                <div className="text-gray-500 text-xs mb-1">Original</div>
                <pre className="whitespace-pre-wrap text-gray-200">{f.originalCode}</pre>
              </div>
              <div className="bg-gray-950 rounded px-3 py-2">
                <div className="text-gray-500 text-xs mb-1">Mutated (not caught)</div>
                <pre className="whitespace-pre-wrap text-red-300">{f.mutatedCode}</pre>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-2">{f.explanation}</p>
            <p className="text-sm text-blue-300 font-mono">FIX: {f.suggestedFix}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

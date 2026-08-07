'use client';
import { useEffect, useState } from 'react';

interface DependencyCheckResult {
  name: string;
  version: string;
  exists: boolean;
}

interface DependencyCheckResponse {
  status: 'success' | 'error';
  results?: DependencyCheckResult[];
  hallucinatedCount?: number;
  error?: string;
}

export default function DependencyResults() {
  const [data, setData] = useState<DependencyCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dependency-check')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setData({ status: 'error', error: 'Failed to reach dependency check API' });
        setLoading(false);
      });
  }, []);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Dependency Check</h2>

      {loading && <p className="text-gray-500">Checking dependencies against npm registry...</p>}

      {!loading && data?.status === 'error' && (
        <div className="bg-red-900 text-red-300 rounded-lg px-4 py-3">
          {data.error ?? 'Dependency check failed.'}
        </div>
      )}

      {!loading && data?.status === 'success' && data.results && (
        <div className="space-y-2">
          {data.results.map((dep) => (
            <div
              key={dep.name}
              data-testid="dependency-row"
              className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                dep.exists ? 'bg-gray-900' : 'bg-red-950 border border-red-800'
              }`}
            >
              <span>
                {dep.name}
                <span className="text-gray-500 ml-2 text-sm">{dep.version}</span>
              </span>
              <span className={dep.exists ? 'text-green-400' : 'text-red-400 font-semibold'}>
                {dep.exists ? '✅ Found on npm' : '⚠️ Not found — possible hallucination'}
              </span>
            </div>
          ))}

          {data.hallucinatedCount === 0 && (
            <div className="mt-4 rounded-lg px-4 py-3 bg-green-900 text-green-300 text-center font-semibold">
              All dependencies verified on npm ✅
            </div>
          )}
        </div>
      )}
    </div>
  );
}
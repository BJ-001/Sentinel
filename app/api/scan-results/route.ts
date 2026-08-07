import { NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { runAuditor } from '@/agents/auditor/run';
import { runVerifier } from '@/agents/verifier/run';
import type { ScanResult, StrykerReport } from '@/lib/types/scan';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_PATH = path.join(DATA_DIR, 'last-scan.json');
const REPORT_PATH = path.join(process.cwd(), 'reports', 'mutation', 'mutation.json');

function getTotalMutantCount(): number {
  try {
    const report: StrykerReport = JSON.parse(readFileSync(REPORT_PATH, 'utf-8'));
    let total = 0;
    for (const fileResult of Object.values(report.files)) {
      total += fileResult.mutants.length;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function GET() {
  if (!existsSync(CACHE_PATH)) {
    return NextResponse.json({ error: 'no cache' }, { status: 404 });
  }
  const cached = readFileSync(CACHE_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(cached));
}

export async function POST() {
  let survivedMutants;
  try {
    survivedMutants = runAuditor();
  } catch (err) {
    const result: ScanResult = {
      status: 'auditor_failed',
      timestamp: new Date().toISOString(),
      mutationScore: 0,
      survivedCount: 0,
      totalMutants: 0,
      findings: [],
      error: err instanceof Error ? err.message : 'Auditor (Stryker) failed',
    };
    return NextResponse.json(result, { status: 500 });
  }

  const totalMutants = getTotalMutantCount();

  try {
    const findings = await runVerifier(survivedMutants);

    const result: ScanResult = {
      status: 'success',
      timestamp: new Date().toISOString(),
      mutationScore:
        totalMutants > 0
          ? Math.round(((totalMutants - survivedMutants.length) / totalMutants) * 10000) / 100
          : 0,
      survivedCount: survivedMutants.length,
      totalMutants,
      findings,
    };

    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (err) {
    const result: ScanResult = {
      status: 'verifier_failed',
      timestamp: new Date().toISOString(),
      mutationScore: 0,
      survivedCount: survivedMutants.length,
      totalMutants,
      findings: [],
      error: err instanceof Error ? err.message : 'Verifier (Gemini) failed',
    };
    return NextResponse.json(result, { status: 500 });
  }
}

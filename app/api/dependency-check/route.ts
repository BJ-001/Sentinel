import { NextResponse } from 'next/server';
import { checkDependencies, getHallucinatedDependencies } from '@/lib/dependencyChecker';

export async function GET() {
  try {
    const results = await checkDependencies();
    const hallucinated = getHallucinatedDependencies(results);

    return NextResponse.json({
      status: 'success',
      results,
      hallucinatedCount: hallucinated.length,
    });
  } catch (err) {
    console.error('Dependency check failed:', err);
    return NextResponse.json(
      { status: 'error', error: 'Failed to check dependencies' },
      { status: 500 }
    );
  }
}
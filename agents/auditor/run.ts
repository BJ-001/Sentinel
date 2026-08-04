import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

export interface SurvivedMutant {
  id: string;
  mutatorName: string;
  fileName: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  originalCode: string;
  mutatedCode: string;
}

export function runAuditor(): SurvivedMutant[] {
  execSync('npx stryker run', { stdio: 'inherit' });

  const reportPath = path.join(process.cwd(), 'reports', 'mutation', 'mutation.json');
  const report = JSON.parse(readFileSync(reportPath, 'utf-8'));

  const survived: SurvivedMutant[] = [];

  for (const [fileName, fileResult] of Object.entries<any>(report.files)) {
    const sourceLines = fileResult.source.split('\n');

    for (const mutant of fileResult.mutants) {
      if (mutant.status === 'Survived') {
        const startLine = mutant.location.start.line - 1; // Stryker uses 1-indexed lines
        const endLine = mutant.location.end.line - 1;

        // Extract the actual original line(s) of code the mutant changed
        const originalCode = sourceLines
          .slice(startLine, endLine + 1)
          .join('\n')
          .trim();

        survived.push({
          id: mutant.id,
          mutatorName: mutant.mutatorName,
          fileName,
          location: mutant.location,
          originalCode,
          mutatedCode: mutant.replacement ?? '',
        });
      }
    }
  }

  return survived;
}
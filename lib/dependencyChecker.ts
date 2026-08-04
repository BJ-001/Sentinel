import { readFileSync } from 'fs';
import path from 'path';

export interface DependencyCheckResult {
  name: string;
  version: string;
  exists: boolean;
}

async function packageExistsOnNpm(packageName: string): Promise<boolean> {
  // npm registry returns 200 if the package exists, 404 if it doesn't
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
  return response.ok;
}

export async function checkDependencies(
  packageJsonPath: string = path.join(process.cwd(), 'package.json')
): Promise<DependencyCheckResult[]> {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const allDeps: Record<string, string> = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
  };

  const results: DependencyCheckResult[] = [];

  for (const [name, version] of Object.entries(allDeps)) {
    const exists = await packageExistsOnNpm(name);
    results.push({ name, version, exists });
  }

  return results;
}

export function getHallucinatedDependencies(
  results: DependencyCheckResult[]
): DependencyCheckResult[] {
  return results.filter((r) => !r.exists);
}
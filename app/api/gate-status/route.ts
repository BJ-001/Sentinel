import { existsSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const root = process.cwd();

  const checks = {
    architectureDoc: existsSync(path.join(root, 'docs', 'architecture.md')),
    agentsRulesFile: existsSync(path.join(root, 'AGENTS.md')),
    agentsAndSkillsDoc: existsSync(path.join(root, 'AGENTS_AND_SKILLS.md')),
    auditorAgent: existsSync(path.join(root, 'agents', 'auditor', 'run.ts')),
    verifierAgent: existsSync(path.join(root, 'agents', 'verifier', 'run.ts')),
    fixSuggestionSkill: existsSync(path.join(root, 'agents', 'verifier', 'fixSuggestionSkill.ts')),
    ciWorkflow: existsSync(path.join(root, '.github', 'workflows', 'ci.yml')),
  };

  const allPassing = Object.values(checks).every(Boolean);

  return NextResponse.json({ checks, allPassing });
}
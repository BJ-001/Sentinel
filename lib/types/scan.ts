export interface VerifiedFinding {
  id: string;
  mutatorName: string;
  fileName: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  originalCode: string;
  mutatedCode: string;
  explanation: string;
  suggestedFix: string;
}

export interface ScanResult {
  status: 'success' | 'auditor_failed' | 'verifier_failed';
  timestamp: string;
  mutationScore: number;
  survivedCount: number;
  totalMutants: number;
  findings: VerifiedFinding[];
  error?: string;
}

export interface StrykerMutant {
  id: string;
  mutatorName: string;
  status: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  replacement?: string;
}

export interface StrykerFileResult {
  source: string;
  mutants: StrykerMutant[];
}

export interface StrykerReport {
  files: Record<string, StrykerFileResult>;
}

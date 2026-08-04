import { runAuditor } from '../auditor/run';
import { runVerifier } from './run';

async function main() {
  const mutants = runAuditor();
  console.log(`Auditor found ${mutants.length} survived mutants. Sending to Verifier...`);

  const verified = await runVerifier(mutants);
  console.log(JSON.stringify(verified, null, 2));
}

main();
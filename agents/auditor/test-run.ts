import { runAuditor } from './run';

const results = runAuditor();
console.log(`Found ${results.length} survived mutants:`);
console.log(JSON.stringify(results, null, 2));
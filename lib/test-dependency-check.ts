import { checkDependencies, getHallucinatedDependencies } from './dependencyChecker';

async function main() {
  console.log('Checking dependencies against npm registry...');
  const results = await checkDependencies();

  console.log(`Checked ${results.length} dependencies.`);

  const hallucinated = getHallucinatedDependencies(results);

  if (hallucinated.length === 0) {
    console.log('✅ All dependencies verified to exist on npm.');
  } else {
    console.log(`⚠️  Found ${hallucinated.length} suspicious/non-existent package(s):`);
    console.log(JSON.stringify(hallucinated, null, 2));
  }
}

main();
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('US-2/US-3: Mutation scan run and results', () => {
  test('AC-2.1: Run Scan control is visible and enabled by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    const runButton = page.getByRole('button', { name: /Run Live Scan/i });
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeEnabled();
  });

  test('AC-2.2: clicking Run Scan shows a loading/in-progress state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    const runButton = page.getByRole('button', { name: /Run Live Scan/i });
    await runButton.click();

    await expect(page.getByRole('button', { name: /Scanning…/i })).toBeDisabled();
    await expect(page.getByText('Running Stryker mutation tests…')).toBeVisible();
  });

  test('AC-2.3: on success, displays each survived mutant with file, original, and mutated code', async ({ page }) => {
    test.setTimeout(120_000); // real scan takes ~70s per project notes

    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    await page.getByRole('button', { name: /Run Live Scan/i }).click();

    // Wait for scan to finish: button re-enables and label returns to default
    await expect(page.getByRole('button', { name: /Run Live Scan/i })).toBeEnabled({ timeout: 100_000 });

    await expect(page.getByText('Live result')).toBeVisible();

    const findingCards = page.getByTestId('finding-card');
    const count = await findingCards.count();

    if (count === 0) {
      // Valid outcome: mutation score could legitimately be 100% with no survivors.
      await expect(page.getByText('No survived mutants — test suite caught everything.')).toBeVisible();
    } else {
      await expect(page.getByText('Original').first()).toBeVisible();
      await expect(page.getByText('Mutated (not caught)').first()).toBeVisible();
      await expect(page.getByText(/FIX:/).first()).toBeVisible();
    }
  });

  test('AC-2.4: distinguishes Stryker (auditor) failure from Verifier/LLM failure', async ({ page }) => {
    await page.route('/api/scan-results', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'auditor_failed', error: 'Stryker process exited with code 1' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    await page.getByRole('button', { name: /Run Live Scan/i }).click();

    await expect(page.getByText('Scan failed')).toBeVisible();
    await expect(page.getByText(/Stryker run/i)).toBeVisible();
  });

  test('AC-2.4 (verifier stage): distinguishes Verifier failure separately', async ({ page }) => {
    await page.route('/api/scan-results', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'verifier_failed', error: 'OpenRouter request failed' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    await page.getByRole('button', { name: /Run Live Scan/i }).click();

    await expect(page.getByText('Scan failed')).toBeVisible();
    await expect(page.getByText(/Explanation generation/i)).toBeVisible();
  });
});
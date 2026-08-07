import { test, expect } from '@playwright/test';

test.describe('US-5: Dependency hallucination check', () => {
  test('AC-5.1: shows each checked package and whether it was found on npm', async ({ page }) => {
    const res = await page.request.get('/api/dependency-check');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.status).toBe('success');
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);

    await page.goto('/');
    await expect(page.getByText('Dependency Check')).toBeVisible();

    // Wait for the fetch-on-mount to resolve before checking individual packages
    await expect(page.getByText(/Checking dependencies against npm registry/)).not.toBeVisible({ timeout: 15_000 });

    for (const dep of body.results as { name: string; exists: boolean }[]) {
      await expect(page.getByText(dep.name).first()).toBeVisible();
    }
  });

  test('AC-5.2: flagged (non-existent) packages are visibly distinguished from passing ones', async ({ page }) => {
    await page.route('/api/dependency-check', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          results: [
            { name: 'react', version: '^18.2.0', exists: true },
            { name: 'definitely-not-a-real-package-xyz', version: '1.0.0', exists: false },
          ],
          hallucinatedCount: 1,
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(/Checking dependencies against npm registry/)).not.toBeVisible({ timeout: 15_000 });

    const passingRow = page.getByTestId('dependency-row').filter({ hasText: 'react' });
    const flaggedRow = page.getByTestId('dependency-row').filter({ hasText: 'definitely-not-a-real-package-xyz' });

    await expect(page.getByText('✅ Found on npm').first()).toBeVisible();
    await expect(page.getByText(/Not found.*possible hallucination/)).toBeVisible();

    // Flagged row should have distinct styling (red border) vs passing row (plain gray)
    await expect(flaggedRow).toHaveClass(/border-red-800/);
    await expect(passingRow).not.toHaveClass(/border-red-800/);
  });
});

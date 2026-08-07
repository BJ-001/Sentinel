import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('US-4: Cached scan fallback', () => {
  test('AC-4.1: on load, shows the last cached scan with a visible timestamp (or empty state if none exists)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    const cachedBadge = page.getByText('Cached result', { exact: true });
    const emptyState = page.getByText('No scan has been run yet');

    const isCached = await cachedBadge.isVisible();

    if (isCached) {
      await expect(cachedBadge).toBeVisible();
      const timestampText = await page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/').first().textContent();
      expect(timestampText).toBeTruthy();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('AC-4.2: if a live scan fails, falls back to showing the cached result rather than empty/broken', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    const hadCache = await page.getByText('Cached result', { exact: true }).isVisible().catch(() => false);

    await page.route('/api/scan-results', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'auditor_failed', error: 'Simulated failure for AC-4.2 test' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole('button', { name: /Run Live Scan/i }).click();

    await expect(page.getByText('Scan failed')).toBeVisible();

    if (hadCache) {
      await expect(page.getByText('Showing last cached result below.')).toBeVisible();
      await expect(page.getByText('Cached result', { exact: true })).toBeVisible();
    } else {
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('AC-4.3: UI clearly distinguishes a live result from a cached one', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/');
    await expect(page.getByText(/Cached result|No scan has been run yet/)).toBeVisible();

    await page.getByRole('button', { name: /Run Live Scan/i }).click();
    await expect(page.getByRole('button', { name: /Run Live Scan/i })).toBeEnabled({ timeout: 100_000 });

    await expect(page.getByText('Live result')).toBeVisible();
    await expect(page.getByText('Cached result', { exact: true })).not.toBeVisible();

    await page.reload();
    await expect(page.getByText('Cached result', { exact: true })).toBeVisible();
  });
});

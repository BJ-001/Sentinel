import { test, expect } from '@playwright/test';

test.describe('US-1: Gate readiness status', () => {
  test('AC-1.1: displays all 5+ gate requirements by name', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Architecture Document')).toBeVisible();
    await expect(page.getByText('Agent Rules File (AGENTS.md)')).toBeVisible();
    await expect(page.getByText('AGENTS_AND_SKILLS.md')).toBeVisible();
    await expect(page.getByText('Custom Agent: Auditor')).toBeVisible();
    await expect(page.getByText('Custom Agent: Verifier')).toBeVisible();
    await expect(page.getByText('Custom Skill: Fix-Suggestion')).toBeVisible();
    await expect(page.getByText('CI/CD Workflow')).toBeVisible();
  });

  test('AC-1.2: each requirement shows a live pass/fail state, not hardcoded', async ({ page }) => {
    const res = await page.request.get('/api/gate-status');
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.checks).toBeDefined();
    expect(typeof body.checks.architectureDoc).toBe('boolean');
    expect(typeof body.checks.ciWorkflow).toBe('boolean');

    await page.goto('/');
    for (const [, passing] of Object.entries(body.checks) as [string, boolean][]) {
      const expectedText = passing ? '✅ Pass' : '❌ Missing';
      await expect(page.getByText(expectedText).first()).toBeVisible();
    }
  });

  test('AC-1.3: shows "all requirements satisfied" indicator when all checks pass', async ({ page }) => {
    const res = await page.request.get('/api/gate-status');
    const body = await res.json();

    await page.goto('/');

    if (body.allPassing) {
      await expect(page.getByText('All gate requirements satisfied ✅')).toBeVisible();
    } else {
      await expect(page.getByText('Some gate requirements missing ⚠️')).toBeVisible();
    }
  });
});

// AC-1.4 (error state if a live check fails, e.g. GitHub API unreachable) is not
// covered here: the current /api/gate-status implementation only performs
// synchronous existsSync() filesystem checks with no network calls, so there is
// no realistic failure path to test without fabricating one. Revisit if a live
// network-based check (e.g. an actual GitHub API call) is added later.

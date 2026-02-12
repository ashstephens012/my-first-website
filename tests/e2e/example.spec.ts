import { test, expect } from '@playwright/test';

test('course catalog loads', async ({ page }) => {
  await page.goto('/courses');
  await expect(page.locator('text=Course Catalog')).toHaveCount(1);
  await expect(page.locator('text=Getting Started')).toHaveCount(1);
});

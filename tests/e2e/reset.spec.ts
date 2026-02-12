import { test, expect } from '@playwright/test';

test('request password reset flow', async ({ page, request }) => {
  await page.goto('/courses');

  // go to signin and then request reset
  await page.goto('/signin');
  await page.click('text=Sign in');
  await page.goto('/signin/request-reset');
  await page.fill('input[type="email"]', 'instructor@example.com');
  await page.click('text=Request reset');

  await expect(page.locator('text=Check your email')).toBeVisible();
});

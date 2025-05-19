import { test, expect } from '@playwright/test';

test('Login', async ({ page }) => {
  // Navigate to the application
  await page.goto('https://saucedemo.com');
  await page.waitForLoadState('networkidle');


});
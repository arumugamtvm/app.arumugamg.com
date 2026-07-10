import { test, expect } from '@playwright/test';

test.describe('Blogs Workspace Responsiveness', () => {

  test.beforeEach(async ({ page }) => {
    const fakeToken = "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJlbWFpbCI6ICJ0ZXN0QGV4YW1wbGUuY29tIiwgImV4cCI6IDE5ODM3MDY4ODN9.signature";
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('jwt_token', token);
    }, fakeToken);
  });

  test('should display blog layout properly on large screens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Skip desktop test on mobile profiles');
    await page.setViewportSize({ width: 1200, height: 800 });

    await page.goto('/blogs');
    const main = page.locator('main');
    await expect(main).toHaveClass(/workspace-blogs/);

    const box = await main.boundingBox();
    // width is 100% minus some padding depending on scrollbar
    expect(box?.width).toBeGreaterThan(900);
  });

  test('should display blog layout properly on mobile screens', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 812 });
    }
    await page.goto('/blogs');

    const main = page.locator('main');
    await expect(main).toHaveClass(/workspace-blogs/);

    const box = await main.boundingBox();
    expect(box?.width).toBeLessThan(400);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Blogs Workspace Responsiveness', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const header = btoa(JSON.stringify({alg:"HS256",typ:"JWT"}));
    const payload = btoa(JSON.stringify({email:"test@example.com", exp: Math.floor(Date.now() / 1000) + 3600}));
    const signature = "fake-signature";
    const fakeToken = `${header}.${payload}.${signature}`;

    await page.evaluate((token) => {
      localStorage.setItem('jwt_token', token);
    }, fakeToken);
  });

  test('should display blog layout properly on large screens', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Skip desktop test on mobile profiles');

    await page.goto('/blogs');
    const main = page.locator('main');
    await expect(main).toHaveClass(/workspace-blogs/);

    const box = await main.boundingBox();
    expect(box?.width).toBeGreaterThan(1000);
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

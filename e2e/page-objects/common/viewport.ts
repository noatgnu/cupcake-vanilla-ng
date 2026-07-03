/**
 * Shared assertion for mobile-viewport layout regressions: a page that grows
 * wider than its own viewport signals an un-wrapped flex row or a fixed-width
 * element that doesn't fit on a phone screen.
 */
import { Page, expect } from "@playwright/test";

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
    };
  });
  expect(overflow.scrollWidth, `document scrollWidth (${overflow.scrollWidth}px) exceeds clientWidth (${overflow.clientWidth}px) — a layout element is overflowing the viewport`).toBeLessThanOrEqual(overflow.clientWidth);
}
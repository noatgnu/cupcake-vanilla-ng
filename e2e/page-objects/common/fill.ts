import { Locator } from "@playwright/test";

/**
 * Fills a locator, then re-fills until the value is still there after the form settles.
 *
 * @param locator Input to fill.
 * @param value Text to enter.
 * @param attempts Most fills to try.
 */
export async function fillReliably(locator: Locator, value: string, attempts = 5): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    await locator.fill(value);
    await locator.page().waitForTimeout(150);
    if ((await locator.inputValue()) === value) return;
  }
  throw new Error(`fillReliably: value did not stick after ${attempts} attempts: ${value}`);
}

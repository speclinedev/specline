import { test, expect } from "@playwright/test";

for (const path of ["/docs/cli", "/handbook/building"]) {
  test(`${path}: mobile navigation and print remain usable`, async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await page.goto(path);
    const menu = page.locator("#menuBtn");
    const toc = page.locator("#toc");
    await expect(toc).toHaveJSProperty("inert", true);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(toc).toHaveJSProperty("inert", false);
    await expect(toc.locator("a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(toc).toHaveJSProperty("inert", true);
    await menu.click();
    await page.locator("#tocBackdrop").click({ position: { x: 500, y: 400 } });
    await expect(menu).toBeFocused();
    await expect(toc).toHaveJSProperty("inert", true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(toc).toHaveJSProperty("inert", false);
    await expect(toc).toHaveAttribute("aria-hidden", "false");
    for (const theme of ["dark", "paper"]) {
      await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, theme);
      const ratios = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const luminance = (hex: string) => {
          const rgb = hex.trim().slice(1).match(/../g)!.map((part) => parseInt(part, 16) / 255)
            .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
          return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
        };
        const bg = luminance(style.getPropertyValue("--bg"));
        return ["--dim", "--accent"].map((key) => {
          const fg = luminance(style.getPropertyValue(key));
          return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05);
        });
      });
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("h1, h2").first()).toHaveCSS("color", "rgb(0, 0, 0)");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(toc).toBeHidden();
  });
}

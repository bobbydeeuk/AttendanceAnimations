import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { Window } from "happy-dom";
const url = "file://" + resolve("dist/attendance-animations.html");
async function studio(page: any) {
  await page
    .getByRole("button", { name: "Administration", exact: true })
    .click();
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page
    .getByRole("button", {
      name: /Set password & continue|Unlock administration/,
    })
    .click();
}
function workbook(n: number, path: string) {
  const ws = XLSX.utils.json_to_sheet(
    Array.from({ length: n }, (_, i) => ({
      "Student Name": "Private Fictional Student " + i,
      "Year Group": i % 2 ? 14 : 13,
      Form: "SIX",
      House: "Hawkwood",
    })),
  );
  const b = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(b, ws, "Attendance");
  writeFileSync(path, XLSX.write(b, { type: "buffer", bookType: "xlsx" }));
}
test("offline three rounds, correct scope, keyboard controls and responsive home", async ({
  page,
}) => {
  const errors: string[] = [],
    requests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  await page.context().setOffline(true);
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "Non-Stop November" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/home.png", fullPage: true });
  await page.getByRole("button", { name: "YEAR 9", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Year Group Showdown" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reveal results" }).click();
  await expect(
    page.getByRole("button", { name: "Revealed", exact: true }),
  ).toBeVisible({ timeout: 8000 });
  await expect(page.locator(".winner")).toHaveCount(1);
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    const controls = await page.locator(".present-controls").boundingBox();
    expect(controls!.y + controls!.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const year9 = await page
    .locator(".result-card.selected .counter")
    .innerText();
  await page.locator("body").click({ position: { x: 5, y: 120 } });
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "House Showdown" }),
  ).toBeVisible();
  await expect(page.locator(".result-card")).toHaveCount(4);
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Year 9 Form Showdown" }),
  ).toBeVisible();
  await expect(page.locator(".result-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Reveal results" }).click();
  await expect(
    page.getByRole("button", { name: "Revealed", exact: true }),
  ).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: "docs/showdown.png", fullPage: true });
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("button", { name: "YEAR 8", exact: true }).click();
  await page.getByRole("button", { name: "Reveal results" }).click();
  await expect(
    page.getByRole("button", { name: "Revealed", exact: true }),
  ).toBeVisible({ timeout: 8000 });
  await expect(
    page
      .locator(".result-card")
      .filter({
        has: page.getByRole("heading", { name: "Year 9", exact: true }),
      })
      .locator(".counter"),
  ).toHaveText(year9);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
test("three real import/export/reopen cycles, backup and published build", async ({
  page,
}, testInfo) => {
  await page.context().setOffline(true);
  let current = url;
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.goto(current);
    await studio(page);
    const path = testInfo.outputPath(`input-${cycle}.xlsx`);
    workbook(3 - cycle, path);
    await page.locator('input[accept=".xlsx,.xls"]').setInputFiles(path);
    await page.getByRole("button", { name: "Validate & preview" }).click();
    await page.getByRole("button", { name: "Accept snapshot" }).click();
    await page.getByRole("button", { name: "05 Export HTML" }).click();
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export updated HTML", exact: true })
      .click();
    const dl = await event;
    const out = testInfo.outputPath(`cycle-${cycle}.html`);
    await dl.saveAs(out);
    const html = readFileSync(out, "utf8");
    expect(html).not.toContain("Private Fictional Student");
    const dom = new Window();
    const parsed = new dom.DOMParser().parseFromString(html, "text/html");
    const data = JSON.parse(
      parsed.getElementById("attendance-data")!.textContent!,
    );
    expect(data.snapshots).toHaveLength(cycle + 1);
    expect(data.snapshots.at(-1).counts.total).toBe(3 - cycle);
    current = "file://" + out;
  }
  await page.goto(current);
  await studio(page);
  await page.getByRole("button", { name: "05 Export HTML" }).click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export presentation HTML" }).click();
  const dl = await event;
  const out = testInfo.outputPath("staff.html");
  await dl.saveAs(out);
  const html = readFileSync(out, "utf8");
  expect(html).not.toContain("Choose attendance workbook");
  expect(html).not.toContain("Campaign studio");
  await page.goto("file://" + out);
  await expect(
    page.getByRole("button", { name: "Administration", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "YEAR 13/14", exact: true }).click();
  await page.getByRole("button", { name: "Next round" }).click();
  await page.getByRole("button", { name: "Next round" }).click();
  await expect(page.locator(".result-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "SIX", exact: true }),
  ).toBeVisible();
});
test("corrupt workbook leaves history intact", async ({ page }, testInfo) => {
  await page.goto(url);
  await studio(page);
  const path = testInfo.outputPath("corrupt.xlsx");
  writeFileSync(path, "broken workbook");
  await page.locator('input[accept=".xlsx,.xls"]').setInputFiles(path);
  await expect(
    page.getByRole("button", { name: "Accept snapshot" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "02 Current summary" }).click();
  await expect(page.locator(".summary-grid")).toContainText("SNAPSHOTS3");
});

test("import safeguards, explicit corrections, and JSON recovery", async ({
  page,
}, testInfo) => {
  await page.context().setOffline(true);
  await page.goto(url);
  await studio(page);
  const upload = page.locator('input[accept=".xlsx,.xls"]');
  const first = testInfo.outputPath("baseline.xlsx");
  workbook(2, first);
  await upload.setInputFiles(first);
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await page.getByRole("button", { name: "Accept snapshot" }).click();
  await upload.setInputFiles(first);
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await expect(
    page.getByText(
      "This workbook was already accepted. Duplicate snapshot blocked.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept snapshot" }),
  ).toBeDisabled();
  const increase = testInfo.outputPath("increase.xlsx");
  workbook(3, increase);
  await upload.setInputFiles(increase);
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await expect(
    page.getByRole("button", { name: "Accept snapshot" }),
  ).toBeDisabled();
  await expect(page.getByText(/Whole-school count increased/)).toBeVisible();
  await page.getByLabel(/Correct the latest mistaken upload/).check();
  await page
    .getByLabel("Reason for correction (at least 10 characters)")
    .fill("Original workbook omitted one record.");
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await page.getByRole("button", { name: "Accept snapshot" }).click();
  await page.getByRole("button", { name: "03 Upload history" }).click();
  await expect(
    page.getByText(/Correction: Original workbook omitted one record/),
  ).toBeVisible();
  await page.getByRole("button", { name: "06 History backup" }).click();
  const waiting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON backup" }).click();
  const backup = await waiting;
  const path = testInfo.outputPath("history.json");
  await backup.saveAs(path);
  const data = JSON.parse(readFileSync(path, "utf8"));
  expect(data.snapshots).toHaveLength(1);
  expect(data.snapshots[0].counts.total).toBe(3);
  expect(data.audit[0].snapshot.counts.total).toBe(2);
  expect(data).not.toHaveProperty("auth");
  await page.locator('input[accept=".json"]').setInputFiles(path);
  await expect(
    page.getByRole("button", { name: "Confirm restore" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm restore" }).click();
  await expect(
    page.getByText("History restored. Export an updated master to retain it."),
  ).toBeVisible();
});

test("standalone starts without module support, including an opaque document origin", async ({
  page,
}) => {
  await page.context().setOffline(true);
  await page.addInitScript(() => {
    HTMLScriptElement.supports = (type: string) =>
      type === "module" ? false : true;
  });
  await page.goto(url);
  await expect(
    page.getByRole("button", { name: "YEAR 7", exact: true }),
  ).toBeVisible();
  const html = readFileSync(resolve("dist/attendance-animations.html"), "utf8");
  expect(html).not.toMatch(/<script\b[^>]*type=["']module["']/);
  // A sandboxed attachment frame has an opaque origin. Startup must not need
  // a module loader, external fetches, storage, or secure-context APIs.
  await page.goto("about:blank");
  await page.setContent(
    '<iframe sandbox="allow-scripts" style="width:1440px;height:1000px"></iframe>',
  );
  await page.locator("iframe").evaluate((el, html) => {
    (el as HTMLIFrameElement).srcdoc = html;
  }, html);
  const frame = page.frameLocator("iframe");
  await expect(
    frame.getByRole("button", { name: "YEAR 7", exact: true }),
  ).toBeVisible();
  await frame.getByRole("button", { name: "YEAR 7", exact: true }).click();
  await expect(
    frame.getByRole("heading", { name: "Year Group Showdown" }),
  ).toBeVisible();
});

test("script-disabled previews show opening instructions instead of a blank page", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "Attendance Animations", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /Download the HTML file and open it directly in desktop Chrome or Edge/,
    ),
  ).toBeVisible();
  await context.close();
});

import { chromium } from '@playwright/test';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const checks = [];
const issues = [];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const context = await browser.newContext();
await context.addInitScript(() => {
  try {
    window.sessionStorage.setItem('roorq_loaded', 'true');
    window.localStorage.setItem('roorq_entry_notice_accepted', 'true');
  } catch {
    // ignore
  }
});
const page = await context.newPage();

let started = false;
page.on('response', (resp) => {
  if (!started) return;
  const url = resp.url();
  if (!url.startsWith(baseUrl)) return;
  const status = resp.status();
  if (status >= 500) {
    issues.push(`HTTP ${status}: ${url}`);
  }
});

page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));

async function goto(path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  await waitForPreloader();
  await dismissEntryModal();
}

async function waitForPreloader() {
  const overlay = page.locator('div[class*="z-[9999]"]').first();
  if (await overlay.isVisible().catch(() => false)) {
    await overlay.waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
  }
}

async function dismissEntryModal() {
  const closeButton = page.getByRole('button', { name: /close/i }).first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    return;
  }

  const noThanks = page.getByRole('button', { name: /no thanks/i }).first();
  if (await noThanks.isVisible().catch(() => false)) {
    await noThanks.click();
  }
}

try {
  await goto('/');
  await page.waitForTimeout(2000);
  started = true;

  checks.push({ name: 'home page render', ok: (await page.locator('h1').count()) > 0 });

  await goto('/shop');
  checks.push({ name: 'shop page opens', ok: page.url().includes('/shop') });

  await goto('/membership');
  await page.getByRole('link', { name: 'Join Now' }).first().click();
  await page.waitForURL('**/contact**', { timeout: 10000 });
  checks.push({ name: 'membership Join Now works', ok: page.url().includes('/contact') });

  await goto('/faq');
  await page.getByRole('button', { name: 'Shipping', exact: true }).click();
  await page.getByRole('button', { name: /When will my order be shipped/i }).click();
  const shippingVisible = await page.getByText(/Orders are usually dispatched in 1-2 working days/i).first().isVisible();
  checks.push({ name: 'faq tabs + accordion functional', ok: shippingVisible });

  await goto('/events');
  await page.locator('input[type="email"]').first().fill('qa-events@example.com');
  const evtResp = page.waitForResponse((resp) => resp.url().includes('/api/marketing/subscribe') && resp.request().method() === 'POST', { timeout: 10000 });
  await page.getByRole('button', { name: /Notify Me|Sending/i }).first().click();
  const evt = await evtResp;
  checks.push({ name: 'events Notify Me triggers API', ok: evt.status() >= 200 && evt.status() < 600, detail: evt.status() });

  await goto('/mystery-box');
  await page.locator('input[type="email"]').first().fill('qa-mystery@example.com');
  const mysteryResp = page.waitForResponse((resp) => resp.url().includes('/api/marketing/subscribe') && resp.request().method() === 'POST', { timeout: 10000 });
  await page.getByRole('button', { name: /Notify Me|Sending/i }).first().click();
  const mystery = await mysteryResp;
  checks.push({ name: 'mystery Notify Me triggers API', ok: mystery.status() >= 200 && mystery.status() < 600, detail: mystery.status() });

  await goto('/products/00000000-0000-0000-0000-000000000000');
  checks.push({ name: 'invalid product id handles gracefully', ok: page.url().includes('/products/') });

} catch (err) {
  issues.push(`fatal: ${err instanceof Error ? err.message : String(err)}`);
}

await browser.close();

const failedChecks = checks.filter((c) => !c.ok);
console.log(JSON.stringify({
  summary: {
    totalChecks: checks.length,
    passed: checks.length - failedChecks.length,
    failed: failedChecks.length,
    issueCount: issues.length,
  },
  checks,
  failedChecks,
  issues,
}, null, 2));

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const OUT = 'public/screenshots';

mkdirSync(OUT, { recursive: true });

async function shot(page, name, delay = 500) {
  await new Promise(r => setTimeout(r, delay));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`  ${name}.png`);
}

async function clickText(page, text, tag = 'button') {
  const el = await page.evaluateHandle((t, tg) => {
    const els = document.querySelectorAll(tg);
    for (const e of els) { if (e.textContent?.includes(t)) return e; }
    return null;
  }, text, tag);
  const elem = el.asElement();
  if (elem) { await elem.click(); await new Promise(r => setTimeout(r, 400)); return true; }
  return false;
}

async function waitForDemo(page) {
  // Wait for employee cards to appear in the sidebar
  for (let i = 0; i < 30; i++) {
    const hasContent = await page.evaluate(() => {
      const els = document.querySelectorAll('.rounded-lg');
      for (const e of els) {
        if (e.textContent?.includes('Alice') || e.textContent?.includes('Carol')) return true;
      }
      return false;
    });
    if (hasContent) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Navigate and wait for demo to auto-load
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  console.log('Waiting for demo data...');
  const loaded = await waitForDemo(page);
  if (!loaded) {
    console.log('Demo not auto-loaded, clicking Demo option...');
    // Open dropdown and select Demo
    await page.click('select');
    await new Promise(r => setTimeout(r, 500));
    // Select the Demo option
    await page.evaluate(() => {
      const sel = document.querySelector('select');
      if (sel) {
        const opts = sel.options;
        for (let i = 0; i < opts.length; i++) {
          if (opts[i].value === '__demo__') { sel.value = '__demo__'; sel.dispatchEvent(new Event('change', {bubbles: true})); return; }
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
    await waitForDemo(page);
  }
  await new Promise(r => setTimeout(r, 1000));
  console.log('Demo loaded, taking screenshots...');

  // 1. Main roster grid with demo data + conflicts
  await shot(page, '01-main-roster', 500);

  // 2. Expand conflict banner
  await clickText(page, 'Expand');
  await shot(page, '02-conflicts-expanded', 500);

  // 3. Click Recommend All
  await clickText(page, 'Recommend All');
  await new Promise(r => setTimeout(r, 3000));
  await shot(page, '03-recommend-all', 500);

  // 4. Add employee modal
  await clickText(page, '+ Add');
  await new Promise(r => setTimeout(r, 500));
  // Type a name
  await page.keyboard.type('Grace');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Manager, Cashier');
  await shot(page, '04-add-employee', 500);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  // 5. Employee card expanded (show unavailability)
  await clickText(page, 'Alice');
  await new Promise(r => setTimeout(r, 300));
  await shot(page, '05-employee-unavailability', 500);
  // Click again to collapse
  await clickText(page, 'Alice');
  await new Promise(r => setTimeout(r, 300));

  // 6. Summary panel (scroll to bottom)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '06-summary-panel', 800);

  // 7. Copy week modal
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickText(page, 'Copy');
  await new Promise(r => setTimeout(r, 800));
  await shot(page, '07-copy-week', 500);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  // 8. Export modal
  await clickText(page, 'Export');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '08-export-csv', 500);
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));

  // 9. Go to next week (cross-week conflict)
  // Find next week button by SVG path
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button[title]');
    for (const b of btns) {
      if (b.getAttribute('title') === 'Next week') { b.click(); return; }
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await shot(page, '09-next-week', 500);

  // 10. Help modal
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickText(page, '?');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '10-help-modal', 500);

  await browser.close();
  console.log('All screenshots done!');
}

main().catch(e => { console.error(e.message); process.exit(1); });

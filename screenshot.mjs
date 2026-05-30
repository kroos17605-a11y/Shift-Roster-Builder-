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
    for (const e of els) { if (e.textContent.includes(t)) return e; }
    return null;
  }, text, tag);
  if (el.asElement()) { await el.asElement().click(); return true; }
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

  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Taking screenshots...');

  // 1. Main roster grid with demo data
  await shot(page, '01-main-roster', 500);

  // 2. Expand conflict banner
  await clickText(page, 'Expand');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '02-conflicts-expanded', 500);

  // 3. Click Recommend All
  await clickText(page, 'Recommend All');
  await new Promise(r => setTimeout(r, 3000));
  await shot(page, '03-recommend-all', 500);

  // 4. Add employee
  await clickText(page, '+ Add');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '04-add-employee', 300);
  await page.keyboard.press('Escape');

  // 5. Employee card expanded
  await new Promise(r => setTimeout(r, 500));
  // Click on the employee name area
  const card = await page.$('.rounded-lg');
  if (card) { await card.click(); await new Promise(r => setTimeout(r, 300)); }
  await shot(page, '05-employee-detail', 300);

  // 6. Summary panel (scroll down)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '06-summary-panel', 500);

  // 7. Copy week modal
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickText(page, 'Copy');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '07-copy-week', 500);
  await page.keyboard.press('Escape');

  // 8. Export modal
  await new Promise(r => setTimeout(r, 300));
  await clickText(page, 'Export');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '08-export-csv', 500);
  await page.keyboard.press('Escape');

  // 9. Go to next week
  await new Promise(r => setTimeout(r, 300));
  const nextBtns = await page.$$('svg');
  for (const btn of nextBtns) {
    const parent = await btn.evaluateHandle(el => el.closest('button[title]'));
    const title = await parent.asElement()?.evaluate(el => el.getAttribute('title'));
    if (title === 'Next week') { await parent.asElement().click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));
  await shot(page, '09-next-week', 500);

  // 10. Help modal
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));
  await clickText(page, '?');
  await new Promise(r => setTimeout(r, 500));
  await shot(page, '10-help-modal', 500);

  await browser.close();
  console.log('Done!');
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});

import puppeteer from 'puppeteer';
import { mkdirSync, rmSync, writeFileSync } from 'fs';

const BASE = 'http://localhost:5173';
const OUT = 'public/screenshots2';
try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`  ${name}.png`);
}

async function clickMatch(page, fn) {
  const el = await page.evaluateHandle(fn);
  if (el.asElement()) {
    await el.asElement().click();
    await new Promise(r => setTimeout(r, 600));
    return true;
  }
  return false;
}

async function loadDemo(page) {
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const hasAlice = await page.evaluate(() => document.body.textContent?.includes('Alice'));
  if (!hasAlice) {
    await page.select('select', '__demo__');
    await new Promise(r => setTimeout(r, 2000));
  }
  await new Promise(r => setTimeout(r, 500));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true, args: ['--no-sandbox'],
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Accept all dialogs
  page.on('dialog', async d => { await d.accept(); });
  await page.evaluateOnNewDocument(() => { window.confirm = () => true; });

  await loadDemo(page);
  console.log('Demo loaded.\n');

  // === C1: ADD ===
  await shot(page, '01_c1-add-before');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent.trim()==='+ Add') return b; return null; });
  await page.keyboard.type('Grace');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Manager');
  await shot(page, '02_c1-add-during');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent.trim()==='Add') return b; return null; });
  await new Promise(r => setTimeout(r, 800));
  await shot(page, '03_c1-add-after');

  // === C1: EDIT ===
  await shot(page, '04_c1-edit-before');
  // Hover Grace card
  await page.evaluate(() => {
    const els = document.querySelectorAll('.rounded-lg');
    for(const e of els) { if(e.textContent?.includes('Grace') && e.textContent?.includes('Manager')) {
      e.dispatchEvent(new MouseEvent('mouseenter', {bubbles:true})); return;
    }}
  });
  await new Promise(r => setTimeout(r, 600));
  // Click edit button near Grace
  await page.evaluate(() => {
    const els = document.querySelectorAll('.rounded-lg');
    for(const e of els) { if(e.textContent?.includes('Grace') && e.textContent?.includes('Manager')) {
      const bs = e.querySelectorAll('button');
      for(const b of bs) { if(b.innerHTML.includes('13.586')||b.innerHTML.includes('M13.586')) { b.click(); return; }}
    }}
  });
  await new Promise(r => setTimeout(r, 600));
  // Wait for dialog portal, then find name input and change it
  await new Promise(r => setTimeout(r, 500));
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for(const i of inputs) {
      if(i.value==='Grace') {
        i.value = 'Grace Hopper';
        i.dispatchEvent(new Event('input', {bubbles:true}));
        i.dispatchEvent(new Event('change', {bubbles:true}));
        return;
      }
    }
  });
  await shot(page, '05_c1-edit-during');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent.trim()==='Save') return b; return null; });
  await new Promise(r => setTimeout(r, 800));
  await shot(page, '06_c1-edit-after');

  // === C1: REMOVE ===
  await shot(page, '07_c1-remove-before');
  // Hover Grace Hopper card
  await page.evaluate(() => {
    const els = document.querySelectorAll('.rounded-lg');
    for(const e of els) { if(e.textContent?.includes('Grace Hopper')) {
      e.dispatchEvent(new MouseEvent('mouseenter', {bubbles:true})); return;
    }}
  });
  await new Promise(r => setTimeout(r, 600));
  await shot(page, '08_c1-remove-during');
  // Click delete (X button)
  await page.evaluate(() => {
    const els = document.querySelectorAll('.rounded-lg');
    for(const e of els) { if(e.textContent?.includes('Grace Hopper')) {
      const bs = e.querySelectorAll('button');
      for(const b of bs) { if(b.innerHTML.includes('M6 6l8 8')||b.innerHTML.includes('6 6l8 8')) { b.click(); return; }}
    }}
  });
  await new Promise(r => setTimeout(r, 800));
  await shot(page, '09_c1-remove-after');

  // === C2: ASSIGN ===
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, '10_c2-assign-before');
  // Click + on an empty cell
  await page.evaluate(() => {
    const bs = document.querySelectorAll('button');
    for(const b of bs) { if(b.textContent.trim()==='+' && b.classList.contains('rounded-full')) { b.click(); return; }}
  });
  await new Promise(r => setTimeout(r, 600));
  // Check if form opened
  const formOpened = await page.evaluate(() => document.body.textContent?.includes('Assign Shift'));
  if (formOpened) {
    await shot(page, '11_c2-assign-during');
  } else {
    // Fallback: just capture the grid
    console.log('  (shift form did not open, capturing grid)');
    await shot(page, '11_c2-assign-during');
  }
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, '12_c2-assign-after');

  // === C3: GRID ===
  await shot(page, '13_c3-weekly-grid');

  // === C4: CONFLICTS ===
  await shot(page, '14_c4-conflict-cells');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent?.includes('Expand')) return b; return null; });
  await shot(page, '15_c4-conflict-expanded');
  await page.evaluate(() => { const els = document.querySelectorAll('*'); for(const e of els) { if(e.textContent?.includes('Cross-week')) { e.scrollIntoView(); return; }}});
  await new Promise(r => setTimeout(r, 300));
  await shot(page, '16_c4-cross-week');

  // === C5: SUMMARY ===
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '17_c5-summary');

  // === B1: DRAG ===
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, '18_b1-drag-before');
  // Show a drag-in-progress by simulating mouse events on a badge
  await page.evaluate(() => {
    const badges = document.querySelectorAll('.cursor-grab');
    if(badges.length>0){ badges[1].dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:400,clientY:200})); badges[1].dispatchEvent(new MouseEvent('mousemove',{bubbles:true,clientX:500,clientY:250})); }
  });
  await new Promise(r => setTimeout(r, 300));
  await shot(page, '19_b1-drag-during');
  await page.evaluate(() => { document.body.dispatchEvent(new MouseEvent('mouseup',{bubbles:true})); });
  await new Promise(r => setTimeout(r, 300));
  await shot(page, '20_b1-drag-after');

  // === B2: AVAILABILITY ===
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, '21_b2-avail-before');
  // Expand Alice card by clicking it
  await clickMatch(page, () => {
    const els = document.querySelectorAll('.rounded-lg');
    for(const e of els) { if(e.textContent?.includes('Alice') && e.textContent?.includes('Supervisor')) return e; }
    return null;
  });
  await new Promise(r => setTimeout(r, 400));
  await shot(page, '22_b2-avail-during');
  // Collapse
  await clickMatch(page, () => {
    const els = document.querySelectorAll('.rounded-lg');
    for(const e of els) { if(e.textContent?.includes('Alice') && e.textContent?.includes('Supervisor')) return e; }
    return null;
  });
  await new Promise(r => setTimeout(r, 300));
  await shot(page, '23_b2-avail-after');

  // === B3: EXPORT ===
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, '24_b3-export-before');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent?.includes('Export')) return b; return null; });
  await new Promise(r => setTimeout(r, 400));
  await shot(page, '25_b3-export-during');
  await page.keyboard.press('Escape');

  // === B4: MOBILE ===
  await new Promise(r => setTimeout(r, 300));
  await page.setViewport({ width: 375, height: 812 });
  await new Promise(r => setTimeout(r, 1500));
  await shot(page, '26_b4-mobile');
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 500));

  // === E1: SOLVER ===
  await page.evaluate(() => window.scrollTo(0, 0));
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent?.includes('Expand')) return b; return null; });
  await new Promise(r => setTimeout(r, 300));
  await shot(page, '27_e1-before');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent?.includes('Recommend All')) return b; return null; });
  await new Promise(r => setTimeout(r, 3000));
  await shot(page, '28_e1-solution');
  await clickMatch(page, () => { const bs = document.querySelectorAll('button'); for(const b of bs) if(b.textContent?.includes('Apply All')) return b; return null; });
  await new Promise(r => setTimeout(r, 1000));
  await shot(page, '29_e1-after');

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => { console.error(e.message); process.exit(1); });

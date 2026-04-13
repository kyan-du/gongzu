const { test } = require('@playwright/test');

test('layout metrics', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://127.0.0.1:8789/ryan/memory/reasoning');
  await page.waitForLoadState('networkidle');

  const data = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const exact = (text) => all.find(el => el.textContent?.trim() === text) || null;
    const contains = (text) => all.find(el => el.textContent?.includes(text)) || null;
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
    };
    const title = exact('宫格推理');
    const hint = contains('先点空位再点候选');
    const candidateTitle = exact('候选答案');
    const boardGrid = document.querySelector('.grid.grid-cols-3.gap-2');
    const candidateGrid = candidateTitle?.nextElementSibling || null;
    const firstCard = candidateGrid?.children?.[0] || null;
    const submit = exact('提交答案');
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      title: box(title),
      hint: box(hint),
      candidateTitle: box(candidateTitle),
      boardGrid: box(boardGrid),
      candidateGrid: box(candidateGrid),
      firstCard: box(firstCard),
      submit: box(submit),
      body: { w: document.body.scrollWidth, h: document.body.scrollHeight }
    };
  });

  console.log('LAYOUT_METRICS ' + JSON.stringify(data));
});

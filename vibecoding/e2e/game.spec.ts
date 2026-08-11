import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('finishes all 71 choices and shares a readable TOP 9 result', async ({
  context,
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 812 });
  await page.goto('/');
  await expect(page.getByTestId('pk-card')).toHaveCount(2);
  await expect(page.getByText('总决选之我嗑lm嗑昏迷了')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始磕糖' })).toHaveCount(0);
  await expect(page.getByText('ROUND 01')).toHaveCount(0);
  await expect(page.getByText('第一轮 · 初遇')).toHaveCount(0);
  await expect(page.getByText('跟着第一反应选，不许端水。')).toHaveCount(0);

  for (let selection = 0; selection < 71; selection += 1) {
    const firstCard = page.getByTestId('pk-card').first();
    expect(
      await page.getByTestId('pk-card').evaluateAll((cards) =>
        cards.every((card) => card.scrollHeight <= card.clientHeight),
      ),
    ).toBe(true);
    await firstCard.click();
    if (selection < 70) {
      await expect(firstCard).toBeEnabled();
    }
  }

  await expect(page.getByText('我心中的神糖 No.1')).toBeVisible();
  await expect(page.getByTestId('result-grid-item')).toHaveCount(9);
  await expect(
    page.getByRole('heading', { name: '令人心动的糖点' }),
  ).toBeVisible();
  await expect(page.getByText(/TOP 9 中有/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: '保存海报' })).toHaveCount(0);

  const shareUrl = await page.getByTestId('share-url').getAttribute('data-url');
  expect(shareUrl).toContain('#result=');
  const recipientPage = await context.newPage();
  for (const width of [360, 390, 430]) {
    await recipientPage.setViewportSize({ width, height: 812 });
    await recipientPage.goto(shareUrl!);
    const cells = recipientPage.getByTestId('result-grid-item');
    await expect(cells).toHaveCount(9);
    const geometry = await cells.evaluateAll((items) => {
      const boxes = items.map((item) => item.getBoundingClientRect());
      return {
        columns: new Set(boxes.map((box) => Math.round(box.left))).size,
        rows: new Set(boxes.map((box) => Math.round(box.top))).size,
        contentFits: items.every(
          (item) =>
            item.scrollWidth <= item.clientWidth &&
            item.scrollHeight <= item.clientHeight,
        ),
      };
    });
    expect(geometry).toEqual({ columns: 3, rows: 3, contentFits: true });
    expect(
      await recipientPage.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await expect(recipientPage.getByRole('button', { name: '我也要测' })).toBeVisible();
  await expect(recipientPage.getByRole('button', { name: '分享结果' })).toHaveCount(0);
});

test('restart asks for confirmation and starts a new random game', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.getByRole('dialog')).toContainText('当前进度会清空');
  await page.getByRole('button', { name: '确定重开' }).click();
  await expect(page.getByText(/已完成.*次选择/)).toHaveCount(0);
  await expect(page.locator('progress')).toHaveAttribute('value', '0');
});

test('keeps compact paired-color PK cards inside common phone widths', async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByTestId('pk-card')).toHaveCount(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(
      await page.getByTestId('pk-card').evaluateAll((cards) =>
        cards.every((card) => {
          const bounds = card.getBoundingClientRect();
          return (
            bounds.left >= 0 &&
            bounds.right <= window.innerWidth &&
            card.scrollHeight <= card.clientHeight &&
            bounds.height <= 340
          );
        }),
      ),
    ).toBe(true);
    const visualRules = await page.evaluate(() => {
      const pair = [...document.querySelectorAll('.accent-pair i')];
      const cardTitle = document.querySelector('.pk-card strong');
      const card = document.querySelector('.pk-card');
      const progress = document.querySelector('progress');
      const titleFont = cardTitle
        ? getComputedStyle(cardTitle).fontFamily.toLowerCase()
        : '';
      return {
        accentGlyphs: pair.map((element) => element.textContent),
        accentColors: pair.map((element) => getComputedStyle(element).color),
        accentSizes: pair.map((element) => {
          const bounds = element.getBoundingClientRect();
          return [bounds.width, bounds.height];
        }),
        titleFont,
        cardCorner: card ? getComputedStyle(card, '::before').content : '',
        progressGradient: progress
          ? getComputedStyle(progress).backgroundImage
          : '',
      };
    });
    expect(visualRules.accentColors).toEqual([
      'rgb(174, 228, 255)',
      'rgb(255, 204, 213)',
    ]);
    expect(visualRules.accentGlyphs).toEqual(['♥', '♥']);
    expect(visualRules.accentSizes[0]).toEqual(visualRules.accentSizes[1]);
    expect(visualRules.titleFont).not.toMatch(/songti|stsong|(^|,\s*)serif(,|$)/);
    expect(visualRules.titleFont).toContain('sans-serif');
    expect(visualRules.cardCorner).toBe('none');
    expect(visualRules.progressGradient).toContain('linear-gradient');
  }
});

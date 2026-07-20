import { expect, test } from '@playwright/test';

interface DigitLayout {
  left: number;
  width: number;
  isNew: boolean;
}

interface SlotLayout {
  left: number;
  width: number;
}

test('keeps changed digits separated after a long idle interval', async ({ page }) => {
  await page.goto('/');

  const score = page.locator('.example-large .numeric-text');
  await expect(score).toHaveAttribute('aria-label', '1,284');

  await page.evaluate(() => {
    const tenMinutesLater = Date.now() + 10 * 60 * 1000;
    Date.now = () => tenMinutesLater;
    Math.random = () => 0.9;
  });

  await page
    .getByRole('region', { name: 'Numorph controls' })
    .getByRole('button', { name: 'Randomize' })
    .click();

  await expect(score).toHaveAttribute('aria-label', '89,999');

  for (const delay of [0, 50, 150]) {
    if (delay > 0) await page.waitForTimeout(delay);

    const digits = await score.locator(':scope > .numeric-text__digit').evaluateAll((nodes) => (
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          width: rect.width,
          isNew: node.getAttribute('data-new') === 'true',
        };
      })
    )) as DigitLayout[];

    expect(digits).toHaveLength(5);
    const existingDigits = digits.filter((digit) => !digit.isNew);
    existingDigits.slice(1).forEach((digit, index) => {
      const previous = existingDigits[index];
      expect(digit.left - previous.left).toBeGreaterThan(previous.width * 0.5);
    });

    const existingSlots = await score.locator(
      ':scope > .numeric-text__digit:not([data-new="true"]), :scope > .numeric-text__part'
    ).evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, width: rect.width };
    })) as SlotLayout[];

    existingSlots.slice(1).forEach((slot, index) => {
      const previous = existingSlots[index];
      expect(slot.left).toBeGreaterThanOrEqual(previous.left + previous.width - 1);
    });
  }

  await expect(score.locator('.numeric-text__exit[data-digit="true"]')).toHaveCount(0);
  const faceCounts = await score.locator(':scope > .numeric-text__digit').evaluateAll(
    (digits) => digits.map((digit) => digit.querySelectorAll('.numeric-text__face').length)
  );
  expect(faceCounts.every((count) => count <= 2)).toBe(true);

  await page.waitForTimeout(1_200);
  await expect(score.locator('.numeric-text__exit')).toHaveCount(0);
  await expect(score.locator('.numeric-text__face--enter')).toHaveCount(0);
  await expect(score.locator('.numeric-text__face--exit')).toHaveCount(0);
});

test('does not queue number motion while the document is hidden', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await page
    .getByRole('region', { name: 'Numorph controls' })
    .getByRole('button', { name: 'Score +25' })
    .click();

  const score = page.locator('.example-large .numeric-text');
  await expect(score).toHaveAttribute('aria-label', '1,309');
  await expect(score.locator('.numeric-text__face--enter')).toHaveCount(0);
  await expect(score.locator('.numeric-text__face--exit')).toHaveCount(0);
});

test('moves upward by default when the value decreases', async ({ page }) => {
  await page.goto('/');

  const controls = page.getByRole('region', { name: 'Numorph controls' });
  const score = page.locator('.example-large .numeric-text');
  await controls.getByRole('button', { name: 'Score -13' }).click();

  await expect(score).toHaveAttribute('aria-label', '1,271');
  await expect(score.locator('.numeric-text__digit[data-animate="true"]').first()).toHaveAttribute(
    'data-direction',
    'up'
  );

  const delays = await score.locator(
    '.numeric-text__digit[data-animate="true"] .numeric-text__face--enter'
  ).evaluateAll(
    (faces) => faces.map((face) => Number.parseFloat(
      getComputedStyle(face).getPropertyValue('--numeric-digit-delay')
    ))
  );
  expect(delays).toHaveLength(2);
  expect(delays[1]).toBeGreaterThan(delays[0]);
});

test('slows the playground animation timing for close inspection', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('checkbox', { name: 'Slow motion' }).check();
  await page
    .getByRole('region', { name: 'Numorph controls' })
    .getByRole('button', { name: 'Score +25' })
    .click();

  const enteringFace = page.locator(
    '.example-large .numeric-text__face--enter'
  ).first();
  await expect(enteringFace).toHaveCSS('--numeric-digit-duration', '3600ms');
});

test('does not restart an active digit animation on an unrelated rerender', async ({ page }) => {
  await page.goto('/');
  await page.addStyleTag({
    content: '.example-large .numeric-text__face { animation-duration: 3000ms !important; }',
  });

  const controls = page.getByRole('region', { name: 'Numorph controls' });
  const score = page.locator('.example-large .numeric-text');
  await controls.getByRole('button', { name: 'Score +25' }).click();

  const enteringFace = score.locator('.numeric-text__face--enter').first();
  await expect(enteringFace).toBeVisible();
  const readStartTime = () => enteringFace.evaluate((element) => (
    element.getAnimations().find((animation) => (
      (animation as CSSAnimation).animationName === 'numeric-text-face-enter-transform'
    ))?.startTime
  ));
  await expect.poll(readStartTime).toEqual(expect.any(Number));
  const startTime = await readStartTime();

  await controls.getByRole('button', { name: 'Gems +250' }).click();

  const startTimeAfterRerender = await readStartTime();
  expect(startTimeAfterRerender).toBe(startTime);
});

test('retargets rapid updates without crisp restarts or layer buildup', async ({ page }) => {
  await page.goto('/');

  const score = page.locator('.example-large .numeric-text');
  const increment = page
    .getByRole('region', { name: 'Numorph controls' })
    .getByRole('button', { name: 'Score +25' });

  await increment.evaluate(async (button) => {
    const target = button as HTMLButtonElement;
    for (let index = 0; index < 6; index += 1) {
      target.click();
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
  });

  await expect(score).toHaveAttribute('aria-label', '1,434');
  const presentation = await score.locator(':scope > .numeric-text__digit').evaluateAll((digits) => ({
    maxFaces: Math.max(...digits.map((digit) => digit.querySelectorAll('.numeric-text__face').length)),
    blurredFaces: digits.flatMap((digit) => [...digit.querySelectorAll<HTMLElement>('.numeric-text__face')])
      .filter((face) => !['none', 'blur(0px)'].includes(getComputedStyle(face).filter)).length,
  }));
  expect(presentation.maxFaces).toBeLessThanOrEqual(2);
  expect(presentation.blurredFaces).toBeGreaterThan(0);

  await page.waitForTimeout(1_200);
  await expect(score.locator('.numeric-text__face--enter')).toHaveCount(0);
  await expect(score.locator('.numeric-text__face--exit')).toHaveCount(0);
});

test('keeps the stagger after the visible transition finishes while the spring settles', async ({ page }) => {
  await page.goto('/');

  const controls = page.getByRole('region', { name: 'Numorph controls' });
  const score = page.locator('.example-large .numeric-text');
  const increment = controls.getByRole('button', { name: 'Score +25' });

  await increment.click();
  await page.waitForTimeout(400);
  await increment.click();

  const delays = await score.locator(
    '.numeric-text__digit[data-animate="true"] .numeric-text__face--enter'
  ).evaluateAll((faces) => faces.map((face) => Number.parseFloat(
    getComputedStyle(face).getPropertyValue('--numeric-digit-delay')
  )));
  expect(delays.length).toBeGreaterThan(1);
  expect(new Set(delays).size).toBe(delays.length);
  expect(delays).toEqual([...delays].sort((left, right) => left - right));
});

test('respects reduced motion without a mount animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await page
    .getByRole('region', { name: 'Numorph controls' })
    .getByRole('button', { name: 'Score +25' })
    .click();

  const score = page.locator('.example-large .numeric-text');
  await expect(score).toHaveAttribute('aria-label', '1,309');
  await expect(score.locator('.numeric-text__face--enter')).toHaveCount(0);
  await expect(score.locator('.numeric-text__face--exit')).toHaveCount(0);
});

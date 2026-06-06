import { mkdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Captures PNGs of the three pages for the README / sharing. Regenerate with:
//   npx playwright test screenshots
const DIR = 'screenshots'

test('capture the three pages', async ({ page, request }) => {
  mkdirSync(DIR, { recursive: true })
  await request.post('http://localhost:8787/reset')
  await page.setViewportSize({ width: 1000, height: 860 })

  // Dashboard — both backends should read as up.
  await page.goto('/')
  await expect(page.locator('.dot.up')).toHaveCount(4)
  await page.screenshot({ path: `${DIR}/dashboard.png`, fullPage: true })

  // React front — owner view, Cancel offered, controller + response visible.
  await page.goto('/react.html')
  await page.getByLabel(/owner/i).check()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/react.png`, fullPage: true })

  // Vanilla front — same.
  await page.goto('/vanilla.html')
  await page.getByLabel(/owner/i).check()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await page.screenshot({ path: `${DIR}/vanilla.png`, fullPage: true })
})

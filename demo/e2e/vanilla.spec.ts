import { expect, test } from '@playwright/test'

const BACKEND = 'http://localhost:8787'

test.beforeEach(async ({ request }) => {
  await request.post(`${BACKEND}/reset`)
})

test('Vanilla front: Cancel is gated on the owner affordance', async ({ page }) => {
  await page.goto('/vanilla.html')

  // anonymous → no cancel
  await page.getByRole('button', { name: 'Load order' }).click()
  await expect(page.getByText(/Order 8f3a2c/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)

  // owner → cancel appears
  await page.getByLabel(/owner/i).check()
  await page.getByRole('button', { name: 'Load order' }).click()
  const cancel = page.getByRole('button', { name: 'Cancel' })
  await expect(cancel).toBeVisible()

  // follow it → state is cancelled
  await cancel.click()
  await expect(page.getByText(/cancelled/)).toBeVisible()
})

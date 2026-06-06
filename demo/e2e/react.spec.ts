import { expect, test } from '@playwright/test'

const BACKEND = 'http://localhost:8787'

test.beforeEach(async ({ request }) => {
  await request.post(`${BACKEND}/reset`)
})

test('React front: Cancel is gated on the owner affordance', async ({ page }) => {
  await page.goto('/react.html')
  await expect(page.getByText(/Order 8f3a2c/)).toBeVisible()

  // anonymous → no cancel
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)

  // owner → cancel appears
  await page.getByLabel(/owner/i).check()
  const cancel = page.getByRole('button', { name: 'Cancel' })
  await expect(cancel).toBeVisible()

  // follow it → the action disappears, state is cancelled
  await cancel.click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
  await expect(page.getByTestId('status')).toHaveText('cancelled')
})

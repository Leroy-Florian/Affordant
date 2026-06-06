import { expect, test } from '@playwright/test'

const BACKEND = 'http://localhost:8787'

test.beforeEach(async ({ page, request }) => {
  await page.addInitScript(() => localStorage.setItem('affordant-lang', 'en'))
  await request.post(`${BACKEND}/reset`)
})

test('Vanilla front: Cancel is gated on the owner affordance', async ({ page }) => {
  await page.goto('/vanilla.html')
  // reactive: loads on open against the default (Express) API
  await expect(page.getByText(/Order 8f3a2c/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)

  // owner → re-renders, cancel appears
  await page.getByLabel(/owner/i).check()
  const cancel = page.getByRole('button', { name: 'Cancel' })
  await expect(cancel).toBeVisible()

  // follow it → the action disappears, state is cancelled
  await cancel.click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
  await expect(page.getByTestId('status')).toHaveText('cancelled')
})

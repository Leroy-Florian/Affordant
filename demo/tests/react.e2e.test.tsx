// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { OrderCard } from '../src/front/OrderCard.js'
import { backends } from './backends.js'
import type { RunningServer } from '../src/server/express.js'

describe.each(backends)('React front × $name backend', ({ start }) => {
  let server: RunningServer
  beforeEach(async () => {
    server = await start()
  })
  afterEach(async () => {
    cleanup()
    await server.close()
  })

  it('hides Cancel for an anonymous visitor', async () => {
    render(<OrderCard baseUrl={server.url} />)
    await screen.findByText(/Order 8f3a2c/)
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('shows Cancel for the owner and removes it after clicking', async () => {
    render(<OrderCard baseUrl={server.url} token="u1" />)

    const button = await screen.findByRole('button', { name: 'Cancel' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    })
    await screen.findByText(/cancelled/)
  })
})

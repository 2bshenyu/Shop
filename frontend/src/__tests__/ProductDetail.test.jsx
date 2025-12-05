import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ProductDetail from '../pages/ProductDetail'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

let originalFetch
beforeEach(() => { originalFetch = global.fetch; global.fetch = vi.fn() })
afterEach(() => { global.fetch = originalFetch; vi.resetAllMocks() })

test('shows out of stock and disables add button', async () => {
  const product = { id: 1, title: 'P', price_cents: 1000, stock: 0, image_url: '', description: '', status: 'active' }
  global.fetch.mockImplementation((url) => {
    if (url.endsWith('/api/products/1')) return Promise.resolve({ ok: true, json: async () => product })
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })

  render(
    <MemoryRouter initialEntries={["/products/1"]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail/>} />
      </Routes>
    </MemoryRouter>
  )

  await waitFor(() => expect(screen.getByText('Stock: 0')).toBeInTheDocument())
  // Add button should be disabled or show unavailable - check for Add to cart text absence
  const addButtons = screen.queryAllByText(/Add to cart/i)
  expect(addButtons.length).toBe(0)
})

test('shows inactive product message', async () => {
  const product = { id: 2, title: 'P2', price_cents: 1000, stock: 5, image_url: '', description: '', status: 'inactive' }
  global.fetch.mockImplementation((url) => {
    if (url.endsWith('/api/products/2')) return Promise.resolve({ ok: true, json: async () => product })
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })

  render(
    <MemoryRouter initialEntries={["/products/2"]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetail/>} />
      </Routes>
    </MemoryRouter>
  )

  await waitFor(() => expect(screen.getByText('该商品暂时不可购买')).toBeInTheDocument())
})

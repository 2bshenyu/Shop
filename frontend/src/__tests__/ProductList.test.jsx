import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import ProductList from '../pages/ProductList'
import { MemoryRouter } from 'react-router-dom'

let originalFetch
beforeEach(() => {
  originalFetch = global.fetch
  global.fetch = vi.fn()
})

afterEach(() => {
  global.fetch = originalFetch
  vi.resetAllMocks()
})

test('shows products and handles empty result', async () => {
  const products = [
    { id: 1, title: 'A', price_cents: 1000, stock: 5, image_url: '' }
  ]
  global.fetch.mockImplementation((url) => {
    if (url.includes('/api/products')) {
      return Promise.resolve({ ok: true, text: async () => JSON.stringify(products) })
    }
    return Promise.resolve({ ok: true, text: async () => '{}' })
  })

  render(<MemoryRouter><ProductList/></MemoryRouter>)

  // wait for product title
  await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())

  // now mock empty result and perform search
  global.fetch.mockImplementation((url) => {
    if (url.includes('/api/products')) {
      return Promise.resolve({ ok: true, text: async () => JSON.stringify([]) })
    }
    return Promise.resolve({ ok: true, text: async () => '{}' })
  })

  const input = screen.getByPlaceholderText('Search')
  fireEvent.change(input, { target: { value: 'zzz' } })
  fireEvent.submit(input)

  await waitFor(() => expect(screen.getByText('未找到相关商品')).toBeInTheDocument())
})

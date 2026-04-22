import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopVideosTable } from '@/components/dashboard/TopVideosTable'

describe('TopVideosTable', () => {
  it('renders the table header', () => {
    render(<TopVideosTable />)
    expect(screen.getByText('Top Posts')).toBeInTheDocument()
    expect(screen.getByText(/Last 7 days/)).toBeInTheDocument()
  })

  it('renders all 4 mock videos', () => {
    render(<TopVideosTable />)
    // Check rank numbers
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('displays hook scores', () => {
    render(<TopVideosTable />)
    expect(screen.getByText('9/10')).toBeInTheDocument()
    expect(screen.getByText('8/10')).toBeInTheDocument()
  })

  it('shows view counts formatted', () => {
    render(<TopVideosTable />)
    expect(screen.getByText('3.1K')).toBeInTheDocument()
    expect(screen.getByText('2.2K')).toBeInTheDocument()
  })
})

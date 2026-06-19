import { describe, it, expect } from 'vitest'
import { formatFileSize } from './format'

describe('formatFileSize', () => {
  it('0 байт', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
  })
  it('килобайты и мегабайты', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
  })
})

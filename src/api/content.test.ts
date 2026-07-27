import { describe, expect, it } from 'vitest'
import { toTrendingKeywords, type HotSearch } from './content'

describe('toTrendingKeywords', () => {
  it('adapts the backend hot-search contract to input placeholder strings', () => {
    const response: HotSearch[] = [
      { content: '特厨隋坡', score: 12, type: 2 },
      { content: '番剧', score: 8, type: 1 },
      { content: '', score: 1, type: 0 },
    ]

    expect(toTrendingKeywords(response)).toEqual(['特厨隋坡', '番剧'])
  })
})

import { teeingOrder } from './scores.ts'

describe('teeingOrder', () => {
  it('puts the lowest score on the played hole first', () => {
    const round = { scores: { a: [3, 4], b: [3, 2], c: [3, 3] } }
    expect(teeingOrder(round, ['a', 'b', 'c'], 1)).toEqual(['b', 'c', 'a'])
  })

  it('breaks a tie with the hole before', () => {
    const round = { scores: { a: [4, 3], b: [2, 3] } }
    expect(teeingOrder(round, ['a', 'b'], 1)).toEqual(['b', 'a'])
  })

  it('traces a tie back several holes', () => {
    const round = { scores: { a: [4, 3, 3], b: [2, 3, 3] } }
    expect(teeingOrder(round, ['a', 'b'], 2)).toEqual(['b', 'a'])
  })

  it('keeps the player order for a tie on hole 1', () => {
    const round = { scores: { a: [3], b: [3] } }
    expect(teeingOrder(round, ['a', 'b'], 0)).toEqual(['a', 'b'])
    expect(teeingOrder(round, ['b', 'a'], 0)).toEqual(['b', 'a'])
  })

  it('handles a single player', () => {
    expect(teeingOrder({ scores: { a: [5] } }, ['a'], 0)).toEqual(['a'])
  })
})

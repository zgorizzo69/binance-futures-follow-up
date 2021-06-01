import namor from '@ggascoigne/namor'

export type Position = {
  team: string
  userName: string
  status: string
  type: string
  symbol: string
  leverage: number
  entryPrice: number
}

const range = (len: number) => {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newPosition = (): Position => {
  const statusChance = Math.random()
  return {
    team: namor.generate({ words: 1, saltLength: 0 }),
    userName: namor.generate({ words: 1, saltLength: 0, subset: 'manly' }),
    status: statusChance > 0.66 ? 'closed' : 'open',
    type: statusChance > 0.56 ? 'short' : 'long',
    symbol: statusChance > 0.66 ? 'USDT/BTC' : statusChance > 0.33 ? 'ETH/USDT' : 'XTZ/BUSD',
    leverage: Math.floor(Math.random() * 100),
    entryPrice: Math.floor(Math.random() * 1000),
  }
}

export type PositionData = Position & {
  subRows?: PositionData[]
}

export function makeData(...lens: number[]): PositionData[] {
  const makeDataLevel = (depth = 0): PositionData[] => {
    const len = lens[depth]
    return range(len).map(() => ({
      ...newPosition(),
      subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
    }))
  }

  return makeDataLevel()
}

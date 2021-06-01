import Binance from 'node-binance-api'
import React from 'react'

import { accounts } from '../accounts.json'

export type Position = {
  team: string
  username: string
  isClose: boolean
  isShort: boolean
  status: string
  type: string
  symbol: string
  leverage: number
  entryPrice: number
  updatedTime: string
  updateTime: number
  positionAmt: any
}

const check = async (
  positions: Position[],
  teamName: string,
  username: string,
  apiKey: string,
  apiSecret: string,
  test: boolean
): Promise<Position[]> => {
  try {
    const binance = new Binance().options({
      APIKEY: apiKey,
      APISECRET: apiSecret,
      verbose: true,
      log(...args: any[]) {
        console.log(Array.prototype.slice.call(args))
      },
      test,
    })
    console.log('positions', JSON.stringify(positions))
    const account = await binance.futuresAccount()
    if (account.code) throw account
    const newPositionsRaw = account.positions.filter((p: { positionAmt: any }) => Number(p.positionAmt) !== 0)
    // make it proper Position

    const newPositions: Position[] = newPositionsRaw.map(
      (p: any) =>
        ({
          team: teamName,
          username,
          isShort: p.positionAmt < 0,
          isClose: false,
          status: 'opened',
          type: p.positionAmt < 0 ? 'short' : 'long',
          updatedTime: new Date(p.updateTime).toLocaleTimeString(),
          ...p,
        } as Position)
    )
    console.log('newPositions', JSON.stringify(newPositions))
    let changedPos: Position[] = []
    let updatedRes: Position[] = []
    if (positions.length > 0) {
      changedPos = checkDiff(
        newPositions,
        positions.filter((p) => p.isClose === false)
      )
      console.log('checkDiff changedPos', JSON.stringify(changedPos))
      if (changedPos.length === 0) {
        updatedRes = positions
      } else {
        //add / update positions based on changes
        const unchanged = positions.filter(
          (p) => p.isClose === true || !changedPos.find((np) => np.symbol === p.symbol)
        )
        const updated = changedPos.filter((np) => positions.find((p) => np.symbol === p.symbol))
        const inserted = changedPos.filter((np) => !positions.find((p) => np.symbol === p.symbol))
        console.log('updated', JSON.stringify(updated))
        console.log('unchanged', JSON.stringify(unchanged))
        console.log('inserted', JSON.stringify(inserted))
        updatedRes = [...unchanged, ...updated, ...inserted]
      }
    } else {
      updatedRes = newPositions
    }

    //positions = newPositions

    for (const pos of changedPos) {
      const msg =
        '[+] Team: ' +
        teamName +
        ' ==> ' +
        username +
        (pos.isClose ? ' closed  ' : ' opened ') +
        ' a ' +
        (pos.isShort ? 'short' : 'long') +
        ' on ' +
        pos.symbol +
        ' with leverage ' +
        pos.leverage +
        '. Entry price: ' +
        pos.entryPrice

      console.log(msg)
    }
    console.log('end changedPos', JSON.stringify(changedPos))
    return updatedRes
  } catch (err) {
    console.log(`[-] Error: `, err)
    return []
  }
}

const checkDiff = (newPositions: Position[], positions: Position[]): Position[] => {
  const closedPos = positions.filter((p) => !newPositions.find((np) => np.symbol === p.symbol))
  const openPos = newPositions.filter((np) => !positions.find((p) => np.symbol === p.symbol))
  const updatedPos = newPositions.filter((np) => positions.find((p) => np.symbol === p.symbol))
  return [
    ...updatedPos.map((pos) => ({
      team: pos.team,
      username: pos.username,
      positionAmt: pos.positionAmt,
      status: 'opened',
      type: pos.type,
      isClose: false,
      symbol: pos.symbol,
      leverage: pos.leverage,
      updatedTime: pos.updatedTime,
      updateTime: pos.updateTime,
      entryPrice: pos.entryPrice,
      isShort: pos.positionAmt < 0,
    })),
    ...openPos.map((pos) => ({
      team: pos.team,
      username: pos.username,
      positionAmt: pos.positionAmt,
      status: 'opened',
      type: pos.type,
      isClose: false,
      symbol: pos.symbol,
      leverage: pos.leverage,
      updatedTime: pos.updatedTime,
      updateTime: pos.updateTime,
      entryPrice: pos.entryPrice,
      isShort: pos.positionAmt < 0,
    })),
    ...closedPos.map((pos) => ({
      team: pos.team,
      username: pos.username,
      positionAmt: pos.positionAmt,
      status: 'closed',
      type: pos.type,
      isClose: true,
      symbol: pos.symbol,
      leverage: pos.leverage,
      updatedTime: pos.updatedTime,
      updateTime: pos.updateTime,
      entryPrice: pos.entryPrice,
      isShort: pos.positionAmt < 0,
    })),
  ]
}

export type PositionData = Position & {
  subRows?: PositionData[]
}

export async function makeData(
  allPositions: PositionData[],
  setData: React.Dispatch<React.SetStateAction<PositionData[] | undefined>>
): Promise<void> {
  const allNewPositions = accounts.flatMap(async (acc) => {
    const pos = allPositions.filter((p) => p.team === acc.name)
    console.log('[+] Check started on ' + acc.username + "'s account")
    return check(pos, acc.name, acc.username, acc.apiKey, acc.apiSecret, acc.test)
  })
  const nP = await Promise.all(allNewPositions)
  const res = ([] as PositionData[]).concat(...nP)

  setData(res)
}

import {
  useDrawPeriod,
  useLastAwardedDrawTimestamps
} from '@generationsoftware/hyperstructure-react-hooks'
import { useEffect, useMemo } from 'react'
import { usePoolTogetherContext } from '../providers/PoolTogetherProvider'

/**
 * Returns the timestamp for the next draw
 * Computes: last draw close time + draw period = next draw close time
 * Automatically refetches when the next draw timestamp is reached
 */
export const useNextDrawTime = () => {
  const { prizePool } = usePoolTogetherContext()
  
  const { data: lastDrawTimestamps, isFetched: isFetchedLastDraw, refetch: refetchLastDraw } =
    useLastAwardedDrawTimestamps(prizePool!)
  
  const { data: drawPeriod, isFetched: isFetchedDrawPeriod, refetch: refetchDrawPeriod } =
    useDrawPeriod(prizePool!)
  
  const nextDrawTimestamp = useMemo(() => {
    if (!lastDrawTimestamps || !drawPeriod) return undefined
    
    // Next draw closes at: last draw close time + draw period
    return lastDrawTimestamps.closedAt + drawPeriod
  }, [lastDrawTimestamps, drawPeriod])

  // Automatically refetches when the next draw timestamp is reached
  useEffect(() => {
    if (!nextDrawTimestamp) return

    const currentTime = Math.floor(Date.now() / 1000) // Current time in seconds
    const timeUntilNextDraw = (nextDrawTimestamp - currentTime) * 1000 // Convert to milliseconds

    // If the timestamp has already passed, refetch immediately
    if (timeUntilNextDraw <= 0) {
      refetchLastDraw()
      refetchDrawPeriod()
      return
    }

    // Schedule refetch exactly when the next draw timestamp is reached
    const timeoutId = setTimeout(() => {
      refetchLastDraw()
      refetchDrawPeriod()
    }, timeUntilNextDraw + 3000)

    return () => clearTimeout(timeoutId)
  }, [nextDrawTimestamp, refetchLastDraw, refetchDrawPeriod])
  
  return {
    data: nextDrawTimestamp,
    isFetched: isFetchedLastDraw && isFetchedDrawPeriod && !!prizePool
  }
}

